import { ChangeDetectorRef, Component, OnInit, HostListener, inject, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { TitleCasePipe, LowerCasePipe } from '@angular/common';
import {
  CheckboxComponent, RadioButtonComponent,
  ToggleComponent, TextareaComponent,
  CollapsibleSectionComponent, CopyUrlFieldComponent, QrCodeComponent,
  FileUploadComponent, ButtonComponent, SelectComponent, SelectOption,
  WizardStepperComponent, ModalComponent, AvatarComponent, AlertBannerComponent,
} from '../../../shared/components';
import { HiIconComponent, IconData } from '../../../shared/components/hi-icon/hi-icon.component';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import type { IconSvgObject } from '@hugeicons/angular';
import { LivePreviewComponent } from './live-preview/live-preview.component';
import { ProductsService, ProductConfig, DeductionChannelConfig, IncomeChannelConfig, DEDUCTION_CHANNEL_DEFS, effectiveChannelStatus, DEFAULT_NOTIFICATION_EVENTS } from '../../../shared/services/products.service';
import { LoansService } from '../../../shared/services/loans.service';
import { OrgBrandingService } from '../../../shared/services/org-branding.service';
import {
  ChevronLeftIcon, ChevronRightIcon,
  PlusSignIcon, EyeIcon, Clock01Icon,
  ViewIcon, LicenseDraftIcon, InformationCircleIcon,
  SmartPhone01Icon, Mail01Icon, IdentityCardIcon, UserIdVerificationIcon,
  Upload01Icon,
} from '@hugeicons/core-free-icons';

export interface LoanTypeOption {
  id: string;
  label: string;
  desc: string;
  detail: string;
  color: string;
  bg: string;
  tags: string[];
}

export const LOAN_TYPES: LoanTypeOption[] = [
  {
    id: 'salary', label: 'Salary Advance', desc: 'Short term loans for private salary earners',
    detail: 'Perfect for employees who need quick access to their earned wages. Uses salary records to verify income and sets up automatic deductions for repayment.',
    color: '#0BA5EC', bg: '#E0F2FE', tags: ['Bank Statement', 'Direct Debit'],
  },
  {
    id: 'public', label: 'Public Sector Loan', desc: 'Loans for government employees',
    detail: 'Designed for federal and state civil servants. Verifies employment through WACS or Remita, with deductions processed through payroll.',
    color: '#F79009', bg: '#FEF3C7', tags: ['Remita', 'WACS'],
  },
  {
    id: 'school', label: 'School Fees Loan', desc: 'Help parents and students pay school fees',
    detail: 'Enables families to pay school fees in advance. Typically requires a guarantor and proof of school admission. Repayment structured around school terms.',
    color: '#12B76A', bg: '#D1FAE5', tags: ['School ID', 'Admission Letter'],
  },
  {
    id: 'corper', label: 'Corper Loan', desc: 'Loans for NYSC members and corps members',
    detail: 'Quick loans for active NYSC corps members. Verified using NYSC call-up details and monthly allowance from Remita. Tenor capped at service duration.',
    color: '#6941C6', bg: '#EDE9FE', tags: ['Remita', 'NYSC ID'],
  },
  {
    id: 'sme', label: 'SME Loan', desc: 'Working capital and growth loans for businesses',
    detail: 'For registered business owners seeking working capital. Requires CAC registration and 6+ months of business bank statements for income assessment.',
    color: '#F04438', bg: '#FEE4E2', tags: ['CAC', 'Bank Statement'],
  },
  {
    id: 'coop', label: 'Cooperative Loan', desc: 'Loans for cooperative society members',
    detail: 'Exclusively for active members of a registered cooperative society. Loan size is typically tied to accumulated savings, with repayment collected monthly.',
    color: '#0BA5EC', bg: '#E0F2FE', tags: ['Membership Verification'],
  },
  {
    id: 'bnpl', label: 'Buy Now Pay Later', desc: 'Instant purchase financing for goods and services',
    detail: 'Enables customers to purchase goods or services and pay over time. Funds disburse directly to the merchant. Designed for minimal friction at checkout.',
    color: '#D92D20', bg: '#FEE4E2', tags: ['ID Verification', 'Affordability'],
  },
  {
    id: 'scratch', label: 'Build from Scratch', desc: 'Create a completely custom loan product',
    detail: 'Start with a blank product and configure every setting from scratch. Best for lenders with unique or non-standard loan products.',
    color: '#667085', bg: '#F2F4F7', tags: ['Start Blank'],
  },
];

export interface LoanConfig {
  template: string;
  // Step 1
  name: string;
  description: string;
  targetAudiences: string[];
  audienceMode: 'everyone' | 'custom';
  minAmount: string;
  maxAmount: string;
  minTenor: string;
  maxTenor: string;
  tenorUnit: string;
  interestModel: string;
  interestRate: string;
  interestChargedWhen: string;
  minAge: string;
  maxAge: string;
  // Step 2
  entryPhone: boolean;
  entryEmail: boolean;
  entryBvn: boolean;
  entryNin: boolean;
  collectPersonal: boolean;
  collectContact: boolean;
  collectAddress: boolean;
  collectEmployment: boolean;
  collectBusiness: boolean;
  collectBank: boolean;
  allowContinue: boolean;
  recogniseExisting: boolean;
  // Step 3
  identityBvn: boolean;
  identityNin: boolean;
  identityPhoneOtp: boolean;
  identityEmailOtp: boolean;
  incomeRemita: boolean;
  incomeIppis: boolean;
  incomeBankStatement: boolean;
  // Repayment deduction channels (separate from income verification)
  deductIppis: boolean;        // At-source payroll deduction via IPPIS (federal only)
  deductRemita: boolean;       // Remita standing order / mandate
  deductDedukt: boolean;       // Dedukt third-party deduction platform
  deductWacs: boolean;         // WACS state-level payroll deduction
  deductRemitaDirectDebit: boolean;  // Direct debit mandate on borrower's account via Remita (fallback)
  deductMonoDirectDebit: boolean;    // Direct debit mandate on borrower's account via Mono (fallback)
  docGovId: string;
  docUtilityBill: string;
  docWorkVerification: string;
  docGuarantorForm: string;
  docSchoolId: string;
  docAdmissionLetter: string;
  docNyscLetter: string;
  docCacCert: string;
  docMembershipCert: string;
  docMembershipId: string;
  // Step 4
  processingFeeType: string;
  processingFeeRate: string;
  processingFeeApplicableTo: string;
  processingFeeMin: string;
  processingFeeMax: string;
  latePenaltyMethod: string;
  latePenaltyRate: string;
  latePenaltyGraceDays: string;
  latePenaltyApplyTo: string;
  latePenaltyChargeFrequency: string;
  latePenaltyApplicationTiming: string;
  latePenaltyParallelAccrual: boolean;
  latePenaltyIncludeGraceInRecurring: boolean;
  latePenaltyAccrualStopCondition: string;
  latePenaltyMaxCapEnabled: boolean;
  latePenaltyMaxCapChargeType: string;
  latePenaltyMaxCapChargeValue: string;
  latePenaltyMaxCapChargeBase: string;
  // Step 5
  disburseTo: string;
  disburseTiming: string;
  offerLetter: boolean;
  namedAccountOnly: boolean;
  repaymentDeductionFirst: boolean;
  videoConfirmation: boolean;
  autoDisburseEnabled: boolean;
  autoDisburseUnder: string;
  restrictActiveLoan: boolean;
  activeLoanPolicy: string;
  // Step 6
  repaymentFrequency: string;
  firstRepaymentDays: string;
  repaymentDay: string;
  // Only used for a Monthly cadence, in place of a single "Day 30" pick — a range lets
  // collection retry automatically on any day within the window instead of failing outright
  // on one fixed date (e.g. the 30th doesn't exist in February).
  repaymentDayRangeStart: string;
  repaymentDayRangeEnd: string;
  minRepayments: string;
  maxRepayments: string;
  moveFirstRepaymentDayOfMonth: string;
  // Step 7
  docTerms: string;
  docPrivacy: string;
  docAgreement: string;
  useDefaultConsent: boolean;
  // Step 8
  welcomeMessage: string;
  thankYouMessage: string;
  supportEmail: string;
  supportPhone: string;
  whatsappContact: string;
  // Brand
  brandColor: string;
  brandName: string;
  // Per-section custom fields (item 11) and custom documents (item 14) — optional
  // so existing localStorage/fallback configs without them still satisfy the type.
  sectionCustomFields?: Record<string, { label: string; type: string; required: string }[]>;
  customDocs?: { name: string; types: string[] }[];
  /** Data URL of the uploaded product banner image, shown on the borrower application portal. */
  bannerImageDataUrl?: string;
  // Per-type differentiation (Phase B, Batch 1)
  /** BNPL only — merchant/purchase categories this product finances. */
  bnplCategories?: string[];
  /** School Fees Loan only — collects student/school details as their own section. */
  collectSchoolInfo: boolean;
  /** Cooperative Loan only — collects membership/society details as their own section. */
  collectCoopInfo: boolean;
  /** Public Sector Loan only — collects civil service details as their own section. */
  collectCivilServiceInfo: boolean;
  /** Corper Loan only — collects NYSC service details as their own section. */
  collectNyscInfo: boolean;
  // Per-type differentiation (Phase D)
  /**
   * Borrower-portal "how do you earn?" step — which income-source options this product
   * offers (e.g. School Fees: private/business; BNPL: private/government/paramilitary/business).
   * Empty/undefined means the step is skipped entirely (existing single-path types).
   */
  incomeSourceOptions?: IncomeSourceOption[];
  /** BNPL only — a category not in the standard list, shown as-is on vendor onboarding. */
  bnplCustomCategory?: string;
  /** BNPL only — default per-vendor spending limit, in Naira. */
  bnplDefaultVendorLimit?: string;
  /** BNPL only — whether the customer enters the purchase amount or the vendor sends an invoice. */
  bnplPurchaseMode?: 'amount' | 'invoice';
}

export type IncomeSourceOption = 'private' | 'government' | 'paramilitary' | 'business';

export const STEPS = [
  { id: 'type',          label: 'Loan Type',               shortLabel: 'Loan Type' },
  { id: 'about',         label: 'About this Loan',         shortLabel: 'About Loan' },
  { id: 'application',   label: 'Set Up Your Application', shortLabel: 'Application' },
  { id: 'verification',  label: 'Verification',            shortLabel: 'Verification' },
  { id: 'pricing',       label: 'Pricing & Fees',          shortLabel: 'Pricing', substeps: ['Fees', 'Penalties'] },
  { id: 'disbursement',  label: 'Disbursement',            shortLabel: 'Disbursement' },
  { id: 'repayment',     label: 'Repayment',               shortLabel: 'Repayment' },
  { id: 'legal',         label: 'Legal',                   shortLabel: 'Legal' },
  { id: 'customisation', label: 'Customisation',           shortLabel: 'Customise' },
  { id: 'review',        label: 'Review & Publish',        shortLabel: 'Review' },
];

const TEMPLATE_PRESETS: Record<string, Partial<LoanConfig>> = {
  salary: {
    name: 'Salary Advance Loan',
    description: 'Quick access to earned wages for private sector employees.',
    entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: true, collectAddress: false, collectBusiness: false,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
    // Open to both private and government salary earners, so every income/deduction rail is offered.
    incomeRemita: true, incomeIppis: true, incomeBankStatement: true,
    deductRemita: true, deductIppis: true, deductDedukt: true, deductWacs: true, deductRemitaDirectDebit: true, deductMonoDirectDebit: true,
    docGovId: 'required', docUtilityBill: 'optional', docWorkVerification: 'required',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none', docMembershipId: 'none',
    disburseTo: 'bank', namedAccountOnly: true, repaymentFrequency: 'Monthly',
    welcomeMessage: 'Welcome! Get quick access to your salary in advance. The process takes about 5 minutes.',
  },
  public: {
    name: 'Public Sector Loan',
    description: 'Affordable loans for federal and state government employees.',
    entryPhone: true, entryEmail: false, entryBvn: true, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: true, collectAddress: false, collectBusiness: false,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: true, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: true, incomeIppis: true, incomeBankStatement: false,
    deductIppis: true, deductRemita: true, deductWacs: true, deductDedukt: false, deductRemitaDirectDebit: true, deductMonoDirectDebit: false,
    docGovId: 'required', docUtilityBill: 'optional', docWorkVerification: 'required',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none', docMembershipId: 'none',
    disburseTo: 'bank', namedAccountOnly: true, repaymentFrequency: 'Monthly',
    welcomeMessage: 'Welcome! Loans designed specifically for civil servants. Get started in minutes.',
    // Civil service details now come from a successful WACS verification on the borrower
    // portal instead of being collected upfront as a separate section.
    collectCivilServiceInfo: false,
  },
  school: {
    name: 'School Fees Loan',
    description: 'Help families pay school fees and educational expenses.',
    entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: true, collectAddress: true, collectBusiness: true,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: false, incomeIppis: false, incomeBankStatement: true,
    deductIppis: true, deductRemita: true, deductDedukt: true, deductWacs: true, deductRemitaDirectDebit: true, deductMonoDirectDebit: true,
    docGovId: 'required', docUtilityBill: 'optional', docWorkVerification: 'none',
    docGuarantorForm: 'required', docSchoolId: 'required', docAdmissionLetter: 'required',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none', docMembershipId: 'none',
    disburseTo: 'bank', repaymentFrequency: 'Monthly',
    welcomeMessage: 'Welcome! Fund your education without the financial stress. Apply in minutes.',
    collectSchoolInfo: true,
    // Parent/guardian applicants are either employed or run a business — the borrower portal
    // asks which, rather than collecting both employment and business info upfront.
    incomeSourceOptions: ['private', 'business'],
  },
  corper: {
    name: 'Corper Wallet Loan',
    description: 'Quick loans for NYSC corps members throughout their service year.',
    entryPhone: true, entryEmail: false, entryBvn: true, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: false, collectAddress: false, collectBusiness: false,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: true, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: true, incomeIppis: false, incomeBankStatement: false,
    deductRemita: true, deductIppis: false, deductDedukt: false, deductWacs: false, deductRemitaDirectDebit: true, deductMonoDirectDebit: false,
    docGovId: 'required', docUtilityBill: 'none', docWorkVerification: 'none',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'required', docCacCert: 'none', docMembershipCert: 'none', docMembershipId: 'none',
    disburseTo: 'bank', repaymentFrequency: 'Monthly',
    welcomeMessage: 'Welcome, corps member! Quick loans to support your NYSC service year.',
    collectNyscInfo: true,
  },
  sme: {
    name: 'SME Working Capital Loan',
    description: 'Working capital and growth financing for registered businesses.',
    entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: false, collectAddress: true, collectBusiness: true,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: true, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: false, incomeIppis: false, incomeBankStatement: true,
    deductIppis: false, deductRemita: false, deductDedukt: false, deductWacs: false, deductRemitaDirectDebit: false, deductMonoDirectDebit: true,
    docGovId: 'required', docUtilityBill: 'required', docWorkVerification: 'optional',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'required', docMembershipCert: 'none', docMembershipId: 'none',
    disburseTo: 'bank', repaymentFrequency: 'Monthly',
    welcomeMessage: 'Welcome! Get the working capital your business needs to grow.',
  },
  coop: {
    name: 'Cooperative Society Loan',
    description: 'Member-only loans tied to savings and cooperative standing.',
    entryPhone: true, entryEmail: false, entryBvn: true, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: true, collectAddress: false, collectBusiness: false,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: false, incomeIppis: false, incomeBankStatement: true,
    deductIppis: false, deductRemita: false, deductDedukt: false, deductWacs: false, deductRemitaDirectDebit: false, deductMonoDirectDebit: true,
    docGovId: 'required', docUtilityBill: 'none', docWorkVerification: 'none',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'required', docMembershipId: 'required',
    disburseTo: 'bank', repaymentFrequency: 'Monthly',
    welcomeMessage: 'Welcome, member! Access your cooperative loan benefits quickly and easily.',
    collectCoopInfo: true,
  },
  bnpl: {
    name: 'Buy Now Pay Later',
    description: 'Instant purchase financing that lets customers shop and pay over time.',
    entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: false, collectAddress: true, collectBusiness: false,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: true, incomeIppis: true, incomeBankStatement: true,
    deductIppis: true, deductRemita: true, deductDedukt: true, deductWacs: true, deductRemitaDirectDebit: true, deductMonoDirectDebit: true,
    docGovId: 'required', docUtilityBill: 'none', docWorkVerification: 'none',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none', docMembershipId: 'none',
    disburseTo: 'third-party', repaymentFrequency: 'Weekly',
    welcomeMessage: 'Shop now, pay later. Get instant purchase financing with no hidden fees.',
    bnplCategories: ['Fashion & Apparel', 'Electronics & Gadgets'],
    bnplPurchaseMode: 'amount',
    incomeSourceOptions: ['private', 'government', 'paramilitary', 'business'],
  },
  scratch: {},
};

@Component({
  selector: 'app-create-loan',
  standalone: true,
  imports: [
    FormsModule, RouterLink, TitleCasePipe, LowerCasePipe,
    HiIconComponent, HugeiconsIconComponent,
    CheckboxComponent, RadioButtonComponent, ToggleComponent,
    TextareaComponent, CollapsibleSectionComponent,
    CopyUrlFieldComponent, QrCodeComponent,
    FileUploadComponent, LivePreviewComponent, ButtonComponent, SelectComponent,
    WizardStepperComponent, ModalComponent, AvatarComponent, AlertBannerComponent,
  ],
  templateUrl: './create-loan.component.html',
  styleUrls: ['./create-loan.component.scss'],
})
export class CreateLoanComponent implements OnInit {
  private readonly orgBranding = inject(OrgBrandingService);
  get orgLogoDataUrl() { return this.orgBranding.branding().logoDataUrl; }

  readonly steps = STEPS;
  currentStep = 0;
  isDraft = false;
  showUnsavedDialog = false;
  pricingTab: 'fees' | 'penalties' = 'fees';
  nameAvailable = false;
  nameCheckTimeout: ReturnType<typeof setTimeout> | null = null;
  showConsentText = false;

  expandPersonal = false;
  expandContact = false;
  expandAddress = false;
  expandEmployment = false;
  expandBusiness = false;
  expandBank = false;
  expandSchoolInfo = false;
  expandCoopInfo = false;
  expandCivilServiceInfo = false;
  expandNyscInfo = false;

  showInsuranceFee = false;
  showAdminFee = false;
  showMgmtFee = false;

  isPublished = false;
  /** Whether publish() actually flipped the product to 'live' — false means it saved as a draft pending channel setup. */
  isProductLive = false;
  /** Names of deduction channels selected but not yet live (credentials/testing pending) — shown on the publish-success screen. */
  pendingSetupChannelNames: string[] = [];
  /** Set when the browser couldn't actually persist this save (e.g. localStorage quota exceeded) — shown on the publish-success screen. */
  persistErrorMessage: string | null = null;
  showCustomFeeModal = false;
  customFeeName = '';
  customFeeType = 'Percentage';
  customFeeRate = '';
  customFees: { name: string; type: string; rate: string }[] = [];

  showCustomFieldModal = false;
  customFieldLabel = '';
  customFieldType = 'Text';
  customFieldRequired = 'required';
  targetSectionKey: string | null = null;

  showRemoveCustomFieldModal = false;
  removeCustomFieldSectionKey: string | null = null;
  removeCustomFieldIndex = -1;

  // Custom documents added via the "Add a custom document" dialog (item 14)
  showCustomDocModal = false;
  customDocName = '';
  customDocTypes: string[] = [];
  customDocs: { name: string; types: string[] }[] = [];

  repaymentOrder = ['Fees', 'Interest', 'Penalty', 'Principal'];
  dragIndex = -1;
  dragOverIndex = -1;

  readonly chevronLeft: IconData = ChevronLeftIcon as IconData;
  readonly chevronRight: IconData = ChevronRightIcon as IconData;
  readonly plusIcon: IconData = PlusSignIcon as IconData;
  readonly eyeIcon: IconData = EyeIcon as IconData;
  readonly clockIcon: IconData = Clock01Icon as IconData;
  readonly viewIcon: IconSvgObject = ViewIcon as IconSvgObject;
  readonly licenseDraftIcon: IconSvgObject = LicenseDraftIcon as IconSvgObject;
  readonly infoIcon: IconData = InformationCircleIcon as unknown as IconData;
  readonly entryPhoneIcon: IconSvgObject = SmartPhone01Icon as IconSvgObject;
  readonly entryEmailIcon: IconSvgObject = Mail01Icon as IconSvgObject;
  readonly entryBvnIcon: IconSvgObject = IdentityCardIcon as IconSvgObject;
  readonly entryNinIcon: IconSvgObject = UserIdVerificationIcon as IconSvgObject;
  readonly uploadIcon: IconSvgObject = Upload01Icon as IconSvgObject;

  readonly loanTypes = LOAN_TYPES;

  // Matches the org identity shown in the sidebar (OrgProfileComponent) — no shared
  // OrgService exists yet, so these mirror sidebar.component.html's hardcoded values.
  readonly orgName = 'Princeps Finance';
  readonly orgAvatarColor = '#E55A2B';
  // AvatarComponent derives initials from first+last word of `name` ("Princeps Finance" → "PF"),
  // but the sidebar's org avatar shows a single letter ("P", via OrgProfileComponent's
  // avatarLetter input). Pass just the first word here so this avatar matches that, rather
  // than showing a different-looking identity for the same organization.
  readonly orgAvatarName = 'Princeps';

  showLoanTypeModal = false;
  pendingTypeId: string | null = null;

  get pendingType(): LoanTypeOption | null {
    return this.loanTypes.find(t => t.id === this.pendingTypeId) ?? null;
  }

  openLoanTypeModal(id: string) {
    this.pendingTypeId = id;
    this.showLoanTypeModal = true;
  }

  closeLoanTypeModal() {
    this.showLoanTypeModal = false;
    this.pendingTypeId = null;
  }

  confirmLoanType() {
    if (!this.pendingTypeId) return;
    const id = this.pendingTypeId;
    this.showLoanTypeModal = false;
    this.pendingTypeId = null;
    this.selectLoanType(id);
  }

  private readonly wizMain = viewChild<ElementRef<HTMLElement>>('wizMain');

  private scrollToTop() {
    // Deferred a tick: the step's new content hasn't been rendered into the DOM yet
    // at the point next()/back()/goToStep() run, so scrolling immediately reset the
    // *old* view instead of the incoming one — leaving the new step mid-scroll.
    setTimeout(() => this.wizMain()?.nativeElement.scrollTo({ top: 0 }));
  }

  selectLoanType(id: string) {
    const preset = TEMPLATE_PRESETS[id];
    if (preset) {
      this.config = { ...this.config, ...preset, template: id };
    } else {
      this.config = { ...this.config, template: id };
    }
    this.next();
  }

  readonly audiences = [
    'Everyone', 'Salary Earners', 'Public Servants',
    'Students', 'Business Owners', 'Cooperative Members',
    'Existing Customers', 'Custom Audience',
  ];

  readonly tenorUnits = ['Days', 'Weeks', 'Months', 'Years'];
  readonly repayFreqs = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'At end of tenor'];
  readonly feeTypes = ['Percentage', 'Flat Amount'];
  readonly processingFeeApplicableToOptions = ['Loan Amount', 'Disbursed Amount', 'Principal'];
  readonly latePenaltyApplyToOptions = ['Outstanding Balance', 'Principal', 'Interest'];
  readonly chargeFrequencyOptions = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'One Time'];
  readonly applicationTimingOptions = ['During Loan Tenor', 'After Loan Tenor', 'On Default'];
  readonly accrualStopConditionOptions = ['Never', 'Until Fully Paid', 'Fixed Number of Occurrences'];
  readonly customFieldTypes = ['Text', 'Number', 'Date', 'File Upload', 'Yes / No'];
  // Shared by both the built-in field list and the "Add custom field" modal.
  readonly requirementOptions: SelectOption[] = [
    { value: 'required', label: 'Required' },
    { value: 'optional', label: 'Optional' },
    { value: 'none', label: "Don't collect" },
  ];

  requirementLabel(value: string): string {
    return this.requirementOptions.find(o => o.value === value)?.label ?? value;
  }
  readonly customDocTypeChoices = ['JPEG', 'PNG', 'PDF'];
  readonly interestModels = ['Flat Rate', 'Reducing Balance', 'Percentage Based'];
  readonly interestChargePeriods = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'One Time'];

  toOptions(values: string[]): SelectOption[] {
    return values.map(v => ({ value: v, label: v }));
  }

  config: LoanConfig = {
    template: '', name: '', description: '', targetAudiences: [], audienceMode: 'everyone',
    minAmount: '', maxAmount: '', minTenor: '', maxTenor: '', tenorUnit: 'Months',
    interestModel: 'Flat Rate', interestRate: '', interestChargedWhen: 'Monthly', minAge: '18', maxAge: '',
    entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
    collectPersonal: true, collectContact: true, collectAddress: false,
    collectEmployment: false, collectBusiness: false, collectBank: false,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: false, incomeIppis: false, incomeBankStatement: false,
    deductIppis: false, deductRemita: false, deductDedukt: false, deductWacs: false, deductRemitaDirectDebit: false, deductMonoDirectDebit: false,
    docGovId: 'none', docUtilityBill: 'none', docWorkVerification: 'none',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none', docMembershipId: 'none',
    processingFeeType: 'Percentage', processingFeeRate: '', processingFeeApplicableTo: 'Loan Amount',
    processingFeeMin: '', processingFeeMax: '',
    latePenaltyMethod: 'Percentage', latePenaltyRate: '', latePenaltyGraceDays: '3',
    latePenaltyApplyTo: 'Outstanding Balance',
    latePenaltyChargeFrequency: 'Daily', latePenaltyApplicationTiming: 'During Loan Tenor',
    latePenaltyParallelAccrual: false, latePenaltyIncludeGraceInRecurring: false,
    latePenaltyAccrualStopCondition: 'Never',
    latePenaltyMaxCapEnabled: false, latePenaltyMaxCapChargeType: 'Percentage',
    latePenaltyMaxCapChargeValue: '', latePenaltyMaxCapChargeBase: 'Outstanding Balance',
    disburseTo: 'bank', disburseTiming: 'instant',
    offerLetter: false, namedAccountOnly: false, repaymentDeductionFirst: false, videoConfirmation: false,
    autoDisburseEnabled: false, autoDisburseUnder: '',
    restrictActiveLoan: false, activeLoanPolicy: 'block',
    repaymentFrequency: 'Monthly', firstRepaymentDays: '30', repaymentDay: 'Day 30',
    repaymentDayRangeStart: '28', repaymentDayRangeEnd: '31',
    minRepayments: '', maxRepayments: '', moveFirstRepaymentDayOfMonth: '',
    docTerms: '', docPrivacy: '', docAgreement: '', useDefaultConsent: false,
    welcomeMessage: '', thankYouMessage: '', supportEmail: 'hello@yourcompany.ng',
    supportPhone: '', whatsappContact: '',
    brandColor: '#6941C6', brandName: '',
    bnplCategories: [], collectSchoolInfo: false, collectCoopInfo: false,
    collectCivilServiceInfo: false, collectNyscInfo: false,
    incomeSourceOptions: [], bnplCustomCategory: '', bnplDefaultVendorLimit: '', bnplPurchaseMode: 'amount',
  };

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly productsService = inject(ProductsService);
  private readonly loansService = inject(LoansService);

  editingProductId: string | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      const type = params['type'];
      if (type && TEMPLATE_PRESETS[type]) {
        const preset = TEMPLATE_PRESETS[type];
        this.config = { ...this.config, ...preset, template: type };
      }

      const id = params['id'];
      if (id) {
        // IndexedDB's initial read is async — wait for it so editing a real product right
        // after a hard refresh doesn't silently fall through to a blank/new-product form.
        await this.productsService.ready;
        const record = this.productsService.getById(id);
        if (record) {
          this.editingProductId = id;
          // Deduction channel checkboxes must reflect what's actually enabled on the record —
          // buildDeductionChannels() preserves a channel's live status/credentials when it stays
          // checked, but only if it starts out checked correctly. Without this, opening any
          // product not originally created through this wizard (e.g. a seeded product) would
          // show every channel unchecked, and saving would silently drop them all.
          const enabledChannelIds = new Set(record.config.deductionChannels.filter((c) => c.enabled).map((c) => c.id));
          const deductionOverrides = {
            deductIppis: enabledChannelIds.has('ippis'),
            deductRemita: enabledChannelIds.has('remita'),
            deductDedukt: enabledChannelIds.has('dedukt'),
            deductWacs: enabledChannelIds.has('wacs'),
            deductRemitaDirectDebit: enabledChannelIds.has('remita-direct-debit'),
            deductMonoDirectDebit: enabledChannelIds.has('mono-direct-debit'),
          };
          if (record.wizardConfig) {
            // Lossless path: restore the exact form state this product was last saved with,
            // so every step (verification, fees, disbursement, repayment, legal, customisation)
            // reflects the saved product instead of resetting to template defaults.
            const wizardConfig = record.wizardConfig as unknown as LoanConfig;
            this.config = { ...this.config, ...wizardConfig, ...deductionOverrides };
            for (const sec of this.collectionSections) {
              sec.customFields = wizardConfig.sectionCustomFields?.[sec.key] ?? [];
            }
            this.customDocs = wizardConfig.customDocs ?? [];
          } else {
            // Fallback for products with no wizard snapshot (e.g. seeded demo data) —
            // only the headline fields can be recovered from the display-oriented config.
            this.config = {
              ...this.config,
              name: record.name,
              description: record.description,
              minAmount: record.minAmount.replace(/,/g, ''),
              maxAmount: record.maxAmount.replace(/,/g, ''),
              minTenor: record.minTenor,
              maxTenor: record.maxTenor,
              tenorUnit: record.tenorUnit,
              interestModel: record.interestType,
              interestRate: record.interestRate,
              interestChargedWhen: record.interestFrequency,
              ...deductionOverrides,
            };
          }
        }
        // This app runs zoneless — the continuation after `await` isn't an Angular-tracked
        // event, so nothing repaints the view on its own without an explicit nudge here.
        this.cdr.markForCheck();
      }
    });
  }

  private sectionByKey(key: string | null) {
    return this.collectionSections.find(s => s.key === key) ?? null;
  }

  confirmRemoveCustomField(sectionKey: string, i: number) {
    this.removeCustomFieldSectionKey = sectionKey;
    this.removeCustomFieldIndex = i;
    this.showRemoveCustomFieldModal = true;
  }

  executeRemoveCustomField() {
    const section = this.sectionByKey(this.removeCustomFieldSectionKey);
    if (section && this.removeCustomFieldIndex >= 0) {
      section.customFields.splice(this.removeCustomFieldIndex, 1);
    }
    this.showRemoveCustomFieldModal = false;
    this.removeCustomFieldSectionKey = null;
    this.removeCustomFieldIndex = -1;
  }

  openAddCustomField(sectionKey: string) {
    this.targetSectionKey = sectionKey;
    this.showCustomFieldModal = true;
  }

  onDragStart(i: number) { this.dragIndex = i; }

  onDragOver(event: DragEvent, i: number) {
    event.preventDefault();
    this.dragOverIndex = i;
  }

  onDrop(i: number) {
    if (this.dragIndex < 0 || this.dragIndex === i) { this.dragIndex = -1; this.dragOverIndex = -1; return; }
    const item = this.repaymentOrder.splice(this.dragIndex, 1)[0];
    this.repaymentOrder.splice(i, 0, item);
    this.dragIndex = -1;
    this.dragOverIndex = -1;
  }

  onDragEnd() { this.dragIndex = -1; this.dragOverIndex = -1; }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.config.name) {
      event.preventDefault();
    }
  }

  get stepId() { return this.steps[this.currentStep].id; }
  get isFirst() { return this.currentStep === 0; }
  get isLast() { return this.currentStep === this.steps.length - 1; }
  get isReview() { return this.stepId === 'review'; }
  get progressPct() { return (this.currentStep / Math.max(this.steps.length - 1, 1)) * 100; }

  stepStatus(i: number): 'active' | 'done' | 'upcoming' {
    if (i === this.currentStep) return 'active';
    return i < this.currentStep ? 'done' : 'upcoming';
  }

  next() { if (!this.isLast) this.currentStep++; this.ensureDraftIdOnReview(); this.scrollToTop(); }
  back() { if (!this.isFirst) this.currentStep--; this.scrollToTop(); }
  goToStep(i: number) { this.currentStep = i; this.ensureDraftIdOnReview(); this.scrollToTop(); }

  private ensureDraftIdOnReview() {
    if (this.stepId === 'review') this.ensureDraftId();
  }

  /** Index of `pricingTab` within the 'pricing' step's substeps — the only step with substeps today. */
  get activeSubstepIndex(): number | null {
    if (this.stepId !== 'pricing') return null;
    return this.pricingTab === 'fees' ? 0 : 1;
  }

  onSubstepClick(event: { stepIndex: number; substepIndex: number }) {
    this.goToStep(event.stepIndex);
    if (this.steps[event.stepIndex].id === 'pricing') {
      this.pricingTab = event.substepIndex === 0 ? 'fees' : 'penalties';
    }
  }

  /** Human-readable eligibility labels derived from the identity/income toggles picked in Verification. */
  private buildEligibilityLabels(): string[] {
    const labels: string[] = [];
    if (this.config.identityBvn) labels.push('BVN');
    if (this.config.identityNin) labels.push('NIN');
    if (this.config.identityPhoneOtp) labels.push('Phone OTP');
    if (this.config.identityEmailOtp) labels.push('Email OTP');
    if (this.config.incomeRemita) labels.push('Remita');
    if (this.config.incomeIppis) labels.push('WACS');
    if (this.config.incomeBankStatement) labels.push('Bank Statement');
    return labels;
  }

  /** Required-document labels derived from the doc-requirement selects in Verification. */
  private buildKycDocs(): string[] {
    const docs: { value: string; label: string }[] = [
      { value: this.config.docGovId, label: 'Government ID' },
      { value: this.config.docUtilityBill, label: 'Utility Bill' },
      { value: this.config.docWorkVerification, label: 'Work Verification' },
      { value: this.config.docGuarantorForm, label: 'Guarantor Form' },
      { value: this.config.docSchoolId, label: 'School ID' },
      { value: this.config.docAdmissionLetter, label: 'Admission Letter' },
      { value: this.config.docNyscLetter, label: 'NYSC Letter' },
      { value: this.config.docCacCert, label: 'CAC Certificate' },
      { value: this.config.docMembershipCert, label: 'Membership Certificate' },
      { value: this.config.docMembershipId, label: 'Membership ID Card' },
    ];
    return docs
      .filter((d) => d.value === 'required' || d.value === 'optional')
      .map((d) => (d.value === 'required' ? `${d.label} (Required)` : `${d.label} (Optional)`));
  }

  /** The income-verification channels selected — newly created, so none are connected yet. */
  private buildIncomeChannels(): IncomeChannelConfig[] {
    const channels: IncomeChannelConfig[] = [];
    if (this.config.incomeRemita) channels.push({ id: 'remita', label: 'Remita', desc: 'Salary verification via Remita', status: 'pending' });
    if (this.config.incomeIppis) channels.push({ id: 'wacs', label: 'WACS', desc: 'State government payroll verification', status: 'pending' });
    if (this.config.incomeBankStatement) channels.push({ id: 'bank', label: 'Bank Statement', desc: 'Automated bank statement analysis', status: 'pending' });
    return channels;
  }

  private readonly deductionChannelCoverage: Record<string, string> = {
    ippis: 'Federal MDAs only',
    remita: 'Federal + some states',
    dedukt: 'Participating employers',
    wacs: 'State MDAs on the WACS platform',
    'remita-direct-debit': 'Any bank',
    'mono-direct-debit': 'Any bank',
  };

  /**
   * The deduction channels selected in Verification, resolved against the canonical
   * DEDUCTION_CHANNEL_DEFS so this rail's required credential fields (e.g. WACS's
   * username/password/secret key) are part of the saved record — the same fields
   * product-detail's Integrations tab will ask for when someone connects it.
   *
   * When editing an existing product, a channel that stays checked keeps whatever
   * progress it already had (status/credentials/lastVerifiedAt) instead of being
   * reset to 'not_configured' — every prior edit silently wiped a rail's connected/
   * live state back to scratch, which would have also violated the "can't disable a
   * channel active loans depend on" rule the moment you re-saved the product at all.
   * Only a channel that's newly checked for the first time starts fresh.
   */
  private buildDeductionChannels(): DeductionChannelConfig[] {
    const selected: { id: string; enabled: boolean }[] = [
      { id: 'ippis', enabled: this.config.deductIppis },
      { id: 'remita', enabled: this.config.deductRemita },
      { id: 'dedukt', enabled: this.config.deductDedukt },
      { id: 'wacs', enabled: this.config.deductWacs },
      { id: 'remita-direct-debit', enabled: this.config.deductRemitaDirectDebit },
      { id: 'mono-direct-debit', enabled: this.config.deductMonoDirectDebit },
    ];
    const existing = this.editingProductId
      ? (this.productsService.getById(this.editingProductId)?.config.deductionChannels ?? [])
      : [];
    return selected
      .filter((s) => s.enabled)
      .map((s, i) => {
        const prior = existing.find((c) => c.id === s.id);
        return {
          id: s.id,
          name: DEDUCTION_CHANNEL_DEFS[s.id].name,
          enabled: true,
          status: prior?.status ?? ('not_configured' as const),
          coverage: this.deductionChannelCoverage[s.id] ?? '',
          priority: i + 1,
          fields: DEDUCTION_CHANNEL_DEFS[s.id].fields,
          credentials: prior?.credentials,
          lastVerifiedAt: prior?.lastVerifiedAt,
        };
      });
  }

  private buildProductConfig(): ProductConfig {
    return {
      minInterest: '0',
      maxInterest: '0',
      eligibility: this.buildEligibilityLabels(),
      activeLoanPolicy: this.config.restrictActiveLoan
        ? 'Restricted — borrowers must repay their active loan before reapplying.'
        : 'Allowed — borrowers may have multiple active loans.',
      kycDocs: this.buildKycDocs(),
      processingFee: {
        enabled: !!this.config.processingFeeRate && this.config.processingFeeRate !== '0',
        method: this.config.processingFeeType,
        value: this.config.processingFeeRate,
        applyTo: this.config.processingFeeApplicableTo,
        min: this.config.processingFeeMin,
        max: this.config.processingFeeMax,
      },
      customFees: [],
      offerLetter: this.config.offerLetter ? 'Digital signature required' : 'Not required',
      disburseToSalary: this.config.disburseTo === 'third-party' ? 'No — funds go to vendor settlement account' : 'No',
      autoDeductions: this.config.repaymentDeductionFirst ? 'Yes' : 'No',
      videoConfirmation: this.config.videoConfirmation ? 'Yes' : 'No',
      incomeChannels: this.buildIncomeChannels(),
      deductionChannels: this.buildDeductionChannels(),
      repaymentFrequency: this.config.repaymentFrequency,
      minRepayments: this.config.minRepayments || '1',
      maxRepayments: this.config.maxRepayments || '12',
      firstPaymentOffset: `${this.config.firstRepaymentDays || '30'} days after disbursement`,
      repaymentOrder: ['Fees', 'Interest', 'Penalty', 'Principal'],
      activateImmediately: this.config.autoDisburseEnabled,
      latePenalty: {
        enabled: !!this.config.latePenaltyRate && this.config.latePenaltyRate !== '0',
        type: this.config.latePenaltyMethod,
        value: this.config.latePenaltyRate,
        frequency: this.config.latePenaltyChargeFrequency,
        gracePeriod: `${this.config.latePenaltyGraceDays || '0'} days`,
      },
      policyText: `By applying for ${this.config.name || 'this product'}, you agree that we may verify your employment, salary, and credit history from third-party sources to assess your eligibility. By checking this box, you confirm that you have read and accept our Privacy Policy and Loan Terms & Conditions.`,
      notificationEvents: DEFAULT_NOTIFICATION_EVENTS,
    };
  }

  /**
   * Lossless snapshot of the wizard's own form state, persisted on the record so
   * re-opening it for edit can prefill every step instead of only the fields
   * buildProductConfig() happens to project into ProductConfig for display.
   */
  private buildWizardConfigSnapshot(): LoanConfig {
    const sectionCustomFields: LoanConfig['sectionCustomFields'] = {};
    for (const sec of this.collectionSections) {
      if (sec.customFields.length) sectionCustomFields[sec.key] = sec.customFields;
    }
    return { ...this.config, sectionCustomFields, customDocs: this.customDocs };
  }

  private buildProductPatch() {
    return {
      name: this.config.name || 'Untitled Product',
      type: (this.config.template === 'bnpl' ? 'bnpl' : 'loan') as 'loan' | 'bnpl',
      description: this.config.description,
      minAmount: this.config.minAmount,
      maxAmount: this.config.maxAmount,
      minTenor: this.config.minTenor,
      maxTenor: this.config.maxTenor,
      tenorUnit: this.config.tenorUnit,
      interestType: this.config.interestModel,
      interestRate: this.config.interestRate,
      interestFrequency: this.config.interestChargedWhen,
      bannerImageDataUrl: this.config.bannerImageDataUrl,
      config: this.buildProductConfig(),
      wizardConfig: this.buildWizardConfigSnapshot() as unknown as Record<string, unknown>,
    };
  }

  /** Blocking dialog message when a save would disable a channel active loans depend on. */
  saveBlockMessage: string | null = null;

  /**
   * If editing an existing product, diffs its currently-enabled channels against what this
   * save is about to persist. Any channel being dropped that active loans still depend on
   * blocks the save — those loans would otherwise lose the rail they're relying on to collect
   * repayment. Returns the first blocking reason found, or null if the save is safe.
   */
  private findChannelDisableBlockReason(newChannels: DeductionChannelConfig[]): string | null {
    if (!this.editingProductId) return null;
    const live = this.productsService.getById(this.editingProductId);
    if (!live) return null;
    const newIds = new Set(newChannels.map((c) => c.id));
    const dropped = live.config.deductionChannels.filter((c) => c.enabled && !newIds.has(c.id));
    for (const channel of dropped) {
      const reason = this.loansService.getChannelDisableBlockReason(this.editingProductId, channel.id, channel.name);
      if (reason) return reason;
    }
    return null;
  }

  /**
   * minAmount/maxAmount/minTenor/maxTenor/interestRate must be non-negative, and the
   * min of each range must not exceed its max — otherwise the product is unusable
   * (e.g. a borrower can never land in an empty amount range) or nonsensical.
   */
  private findFieldValidationError(): string | null {
    const num = (v: string) => +String(v).replace(/,/g, '');
    const minAmount = num(this.config.minAmount);
    const maxAmount = num(this.config.maxAmount);
    const minTenor = num(this.config.minTenor);
    const maxTenor = num(this.config.maxTenor);
    const interestRate = num(this.config.interestRate);

    if ([minAmount, maxAmount, minTenor, maxTenor, interestRate].some((v) => Number.isNaN(v) || v < 0)) {
      return 'Amount, tenor, and interest rate fields must be zero or positive numbers.';
    }
    if (minAmount > maxAmount) return 'Minimum amount cannot be greater than maximum amount.';
    if (minTenor > maxTenor) return 'Minimum tenor cannot be greater than maximum tenor.';

    const isDayOfMonth = (v: string) => !v || (num(v) >= 1 && num(v) <= 31 && Number.isInteger(num(v)));
    if (!isDayOfMonth(this.config.moveFirstRepaymentDayOfMonth)) {
      return 'The "move first repayment" day must be a whole number between 1 and 31.';
    }
    if (this.config.repaymentFrequency === 'Monthly') {
      const rangeStart = this.config.repaymentDayRangeStart;
      const rangeEnd = this.config.repaymentDayRangeEnd;
      if (!isDayOfMonth(rangeStart) || !isDayOfMonth(rangeEnd)) {
        return 'Repayment day range must use whole numbers between 1 and 31.';
      }
      if (rangeStart && rangeEnd && num(rangeStart) > num(rangeEnd)) {
        return 'Repayment day "From" cannot be later than "To".';
      }
    }
    return null;
  }

  saveDraft() {
    const fieldError = this.findFieldValidationError();
    if (fieldError) {
      this.saveBlockMessage = fieldError;
      return;
    }
    const deductionChannels = this.buildDeductionChannels();
    const blockReason = this.findChannelDisableBlockReason(deductionChannels);
    if (blockReason) {
      this.saveBlockMessage = blockReason;
      return;
    }
    const patch = this.buildProductPatch();
    if (this.editingProductId) {
      this.productsService.update(this.editingProductId, patch);
    } else {
      const created = this.productsService.create({ ...patch, status: 'draft' });
      this.editingProductId = created.id;
    }
    this.syncWebsiteLink();
    this.isDraft = true;
    this.showUnsavedDialog = false;
    const persistError = this.productsService.persistError();
    if (persistError) this.saveBlockMessage = persistError;
  }

  /**
   * The Review step shows the borrower application link before the user has ever
   * clicked Save/Publish — but that link needs a real product id to point anywhere,
   * and a brand-new product has no id until its first save. Silently create the
   * underlying draft record (skipping the field-validation gate, since this isn't
   * a real "save" action the user asked for) so the link that's about to render
   * is genuinely live rather than a fake placeholder.
   */
  private ensureDraftId() {
    if (this.editingProductId) return;
    const patch = this.buildProductPatch();
    const created = this.productsService.create({ ...patch, status: 'draft' });
    this.editingProductId = created.id;
    this.syncWebsiteLink();
  }

  /**
   * product-detail's hero section reads `product.websiteLink` directly — it was
   * never populated for products created through this wizard (only hardcoded on
   * seeded demo data), so real products showed a blank link there. Keep it in sync
   * with the same /apply route the wizard's own "Shareable link" field shows.
   */
  private syncWebsiteLink() {
    if (!this.editingProductId) return;
    this.productsService.update(this.editingProductId, { websiteLink: this.publishUrl });
  }

  discardAndLeave() {
    this.showUnsavedDialog = false;
    this.router.navigate(['/products']);
  }

  publish() {
    const fieldError = this.findFieldValidationError();
    if (fieldError) {
      this.saveBlockMessage = fieldError;
      return;
    }
    const deductionChannels = this.buildDeductionChannels();
    const blockReason = this.findChannelDisableBlockReason(deductionChannels);
    if (blockReason) {
      this.saveBlockMessage = blockReason;
      return;
    }
    const patch = this.buildProductPatch();
    // Publishing from the wizard only ever produces a draft — deduction/income channel
    // credentials aren't set up here at all, only selected. Setup and going live both happen
    // afterward on the product's own page (product-detail), once channels are actually
    // connected and tested.
    const status = 'draft';
    if (this.editingProductId) {
      this.productsService.update(this.editingProductId, { ...patch, status });
    } else {
      const created = this.productsService.create({ ...patch, status });
      this.editingProductId = created.id;
    }
    this.syncWebsiteLink();
    // Per-section custom fields and custom documents live on `collectionSections`/`customDocs`
    // (component state, not `config`) — fold them into the published snapshot so the borrower
    // application actually reflects what was configured here.
    const sectionCustomFields: LoanConfig['sectionCustomFields'] = {};
    for (const sec of this.collectionSections) {
      if (sec.customFields.length) sectionCustomFields[sec.key] = sec.customFields;
    }
    const publishedConfig: LoanConfig = {
      ...this.config,
      sectionCustomFields,
      customDocs: this.customDocs,
    };
    // Keyed by product id — previously a single global key, so publishing a second
    // product silently overwrote the first one's preview config. Fire-and-forget: a failure
    // here must not abort the rest of publish() (the success modal below, etc.) the way an
    // uncaught/awaited rejection would — same reasoning as ProductsService.persist().
    this.productsService.setPublishedConfig(this.editingProductId, publishedConfig as unknown as Record<string, unknown>)
      .catch((e) => console.error('Failed to persist published config', e));
    // A selected deduction channel isn't actually usable until its credentials are set up
    // and it passes connection testing (see effectiveChannelStatus) — publishing the product
    // record doesn't do that automatically, so applicants could apply for a loan whose
    // repayment channel isn't live yet. Surface that instead of implying it's fully ready.
    this.pendingSetupChannelNames = deductionChannels
      .filter((c) => effectiveChannelStatus(c) !== 'live')
      .map((c) => c.name);
    this.isPublished = true;
    this.isDraft = false;
    this.persistErrorMessage = this.productsService.persistError();
  }

  toggleAudience(aud: string) {
    const idx = this.config.targetAudiences.indexOf(aud);
    if (idx >= 0) {
      this.config.targetAudiences = this.config.targetAudiences.filter(a => a !== aud);
    } else {
      this.config.targetAudiences = [...this.config.targetAudiences, aud];
    }
  }

  onNameChange(val: string) {
    this.config.name = val;
    this.nameAvailable = false;
    if (this.nameCheckTimeout) clearTimeout(this.nameCheckTimeout);
    if (val.trim().length > 2) {
      this.nameCheckTimeout = setTimeout(() => { this.nameAvailable = true; }, 500);
    }
  }

  getConfig(key: string): unknown {
    return (this.config as unknown as Record<string, unknown>)[key];
  }

  setConfig(key: string, value: unknown) {
    (this.config as unknown as Record<string, unknown>)[key] = value;
  }

  /** Strips non-digits and re-inserts thousand separators live as the user types an amount. */
  onAmountInput(key: string, raw: string) {
    const digits = raw.replace(/[^\d]/g, '');
    this.setConfig(key, digits ? Number(digits).toLocaleString('en-US') : '');
  }

  /** Same as onAmountInput but for the custom-fee dialog's own field (not part of `config`). */
  onCustomFeeRateInput(raw: string) {
    const digits = raw.replace(/[^\d]/g, '');
    this.customFeeRate = digits ? Number(digits).toLocaleString('en-US') : '';
  }

  /**
   * Persisted as a data URL (not a File — the whole config, including this, is what
   * gets JSON.stringify'd into localStorage for both the draft/product record and the
   * published snapshot the borrower portal reads) so the banner survives a reload and
   * shows up on the borrower application portal, not just live in this editing session.
   */
  onBannerFileSelected(file: File | null) {
    if (!file) {
      this.config.bannerImageDataUrl = undefined;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.config.bannerImageDataUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  toggleBoolConfig(key: string) {
    const rec = this.config as unknown as Record<string, unknown>;
    rec[key] = !rec[key];
  }

  setDocRequirement(doc: string, val: string) {
    this.setConfig(doc, val);
  }

  getDocRequirement(doc: string): string {
    return (this.getConfig(doc) as string) || 'none';
  }

  get showIncomeVerification(): boolean { return true; }
  get noIncomeSelected(): boolean {
    return !this.config.incomeRemita && !this.config.incomeIppis && !this.config.incomeBankStatement;
  }

  get noDeductionSelected(): boolean {
    return !this.config.deductIppis && !this.config.deductRemita && !this.config.deductDedukt && !this.config.deductWacs
      && !this.config.deductRemitaDirectDebit && !this.config.deductMonoDirectDebit;
  }

  get activeDeductionChannels(): string[] {
    const ch: string[] = [];
    if (this.config.deductIppis)             ch.push('IPPIS');
    if (this.config.deductRemita)            ch.push('Remita');
    if (this.config.deductDedukt)            ch.push('Dedukt');
    if (this.config.deductWacs)              ch.push('WACS');
    if (this.config.deductRemitaDirectDebit) ch.push('Remita Direct Debit');
    if (this.config.deductMonoDirectDebit)   ch.push('Mono Direct Debit');
    return ch;
  }

  get showSchoolDocs(): boolean { return this.config.template === 'school'; }
  get showCorperDocs(): boolean { return this.config.template === 'corper'; }
  get showSmeDocs(): boolean { return this.config.template === 'sme'; }
  get showCoopDocs(): boolean { return this.config.template === 'coop'; }

  get borrowerJourneySteps(): { label: string; sub: string }[] {
    const steps: { label: string; sub: string }[] = [];
    steps.push({ label: 'Contact Information', sub: 'Phone, email or identifier' });
    if (this.config.identityBvn || this.config.identityNin || this.config.identityPhoneOtp || this.config.identityEmailOtp) {
      steps.push({ label: 'Verify Your Identity', sub: 'BVN, NIN or OTP verification' });
    }
    if (this.config.collectEmployment) {
      steps.push({ label: 'Confirm Employment', sub: 'Employer and income details' });
    }
    const anyDoc = this.config.docGovId === 'required' || this.config.docWorkVerification === 'required'
      || this.config.docGuarantorForm === 'required' || this.config.docSchoolId === 'required'
      || this.config.docAdmissionLetter === 'required' || this.config.docNyscLetter === 'required'
      || this.config.docCacCert === 'required' || this.config.docMembershipCert === 'required';
    if (anyDoc) {
      steps.push({ label: 'Upload Documents', sub: 'Required verification documents' });
    }
    steps.push({ label: 'Review & Submit', sub: 'Confirm and send application' });
    return steps;
  }

  get estimatedMinutes(): number {
    const heavy = this.config.template === 'sme';
    const medium = this.config.collectBusiness || this.config.docCacCert === 'required';
    if (heavy) return 8;
    if (medium) return 6;
    return 4;
  }

  // Was a fake placeholder domain (apply.caltos.co) that didn't correspond to any
  // real route — the borrower application actually lives at this app's own /apply
  // route, keyed by product id (see ApplyComponent, which reads ?product= from the URL).
  get publishUrl(): string {
    if (!this.editingProductId) return '';
    return `${window.location.origin}/apply?product=${this.editingProductId}`;
  }

  get descLength(): number { return this.config.description?.length ?? 0; }

  compact(arr: string[]): string { return arr.filter(s => s).join(', ') || '—'; }

  addCustomFee() {
    if (!this.customFeeName.trim()) return;
    this.customFees.push({ name: this.customFeeName, type: this.customFeeType, rate: this.customFeeRate });
    this.customFeeName = ''; this.customFeeType = 'Percentage'; this.customFeeRate = '';
    this.showCustomFeeModal = false;
  }

  removeCustomFee(i: number) { this.customFees.splice(i, 1); }

  addCustomField() {
    if (!this.customFieldLabel.trim()) return;
    const section = this.sectionByKey(this.targetSectionKey);
    if (!section) return;
    const newField = { label: this.customFieldLabel, type: this.customFieldType, required: this.customFieldRequired };
    section.customFields.push(newField);
    this.customFieldLabel = ''; this.customFieldType = 'Text'; this.customFieldRequired = 'required';
    this.showCustomFieldModal = false;
    this.targetSectionKey = null;
  }

  removeCustomField(sectionKey: string, i: number) {
    const section = this.sectionByKey(sectionKey);
    section?.customFields.splice(i, 1);
  }

  // ── Custom documents (item 14) ──────────────────────────────────────────
  toggleCustomDocType(type: string) {
    const idx = this.customDocTypes.indexOf(type);
    if (idx >= 0) this.customDocTypes.splice(idx, 1);
    else this.customDocTypes.push(type);
  }

  addCustomDoc() {
    if (!this.customDocName.trim() || this.customDocTypes.length === 0) return;
    this.customDocs.push({ name: this.customDocName, types: [...this.customDocTypes] });
    this.customDocName = '';
    this.customDocTypes = [];
    this.showCustomDocModal = false;
  }

  customDocKey(i: number): string { return `custom-${i}`; }

  moveRepaymentOrder(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= this.repaymentOrder.length) return;
    [this.repaymentOrder[i], this.repaymentOrder[j]] = [this.repaymentOrder[j], this.repaymentOrder[i]];
  }

  reviewSections = [
    { title: 'Loan Details',       subtitle: 'Name, audience, amounts, tenor, interest' },
    { title: 'Application Setup',  subtitle: 'Entry methods, data collection, returning applicants' },
    { title: 'Verification',       subtitle: 'Identity, income, and document requirements' },
    { title: 'Pricing & Fees',     subtitle: 'Processing fee and penalties' },
    { title: 'Disbursement',       subtitle: 'Method, timing, and rules' },
    { title: 'Repayment',          subtitle: 'Frequency, first payment, repayment day' },
    { title: 'Legal',              subtitle: 'Documents and consent text' },
    { title: 'Customisation',      subtitle: 'Branding and support contacts' },
  ];

  reviewExpanded: boolean[] = [true, false, false, false, false, false, false, false];

  toggleReview(i: number) {
    this.reviewExpanded[i] = !this.reviewExpanded[i];
  }

  entryOptions = [
    { id: 'entryPhone', label: 'Phone Number',   sub: 'Applicants start with their phone' },
    { id: 'entryEmail', label: 'Email Address',  sub: 'Applicants start with their email' },
    { id: 'entryBvn',   label: 'BVN',            sub: 'Applicants start with their BVN' },
    { id: 'entryNin',   label: 'NIN',            sub: 'Applicants start with their NIN' },
  ];

  private mkFields(names: string[]): { name: string; requirement: string }[] {
    return names.map(name => ({ name, requirement: 'required' }));
  }

  // `count` is no longer a stored field — the template derives it live from
  // fields.length + customFields.length so it grows as custom fields are added.
  collectionSections: {
    key: string; label: string;
    fields: { name: string; requirement: string }[]; expand: string;
    customFields: { label: string; type: string; required: string }[];
  }[] = [
    { key: 'collectPersonal',    label: 'Personal Information',
      fields: this.mkFields(['First Name', 'Middle Name', 'Last Name', 'Date of Birth', 'Gender']),
      expand: 'expandPersonal', customFields: [] },
    { key: 'collectContact',     label: 'Contact Information',
      fields: this.mkFields(['Email Address', 'Phone Number', 'WhatsApp Number', 'Preferred Contact']),
      expand: 'expandContact', customFields: [] },
    { key: 'collectAddress',     label: 'Address Information',
      fields: this.mkFields(['Street Address', 'City', 'State', 'LGA', 'Landmark']),
      expand: 'expandAddress', customFields: [] },
    { key: 'collectEmployment',  label: 'Employment Information',
      fields: this.mkFields(['Employer Name', 'Staff ID', 'Job Title', 'Monthly Salary', 'Employment Type']),
      expand: 'expandEmployment', customFields: [] },
    { key: 'collectBusiness',    label: 'Business Information',
      fields: this.mkFields(['Business Name', 'CAC Number', 'Business Type', 'Annual Revenue', 'Role in Business (Owner / Director / Chairman / etc.)']),
      expand: 'expandBusiness', customFields: [] },
    { key: 'collectBank',        label: 'Bank Account Details',
      fields: this.mkFields(['Bank Name', 'Account Number', 'Account Name']),
      expand: 'expandBank', customFields: [] },
    { key: 'collectSchoolInfo',  label: 'School Information',
      fields: this.mkFields(['School Name', 'Student Name (if different from applicant)', 'Class / Level', 'Term / Session']),
      expand: 'expandSchoolInfo', customFields: [] },
    { key: 'collectCoopInfo',    label: 'Cooperative Membership',
      fields: this.mkFields(['Cooperative / Society Name', 'Membership Number', 'Membership Start Date', 'Monthly Savings Contribution']),
      expand: 'expandCoopInfo', customFields: [] },
    { key: 'collectCivilServiceInfo', label: 'Civil Service Details',
      fields: this.mkFields(['Ministry / Department / Agency (MDA)', 'Employee / Service Number', 'Grade Level', 'Cadre']),
      expand: 'expandCivilServiceInfo', customFields: [] },
    { key: 'collectNyscInfo',    label: 'NYSC Details',
      fields: this.mkFields(['State Code', 'Call-Up Number', 'Place of Primary Assignment (PPA)', 'Service Start Date']),
      expand: 'expandNyscInfo', customFields: [] },
  ];

  /**
   * These type-specific sections only make sense for their own loan type — filtered out of
   * the collection list for every other template instead of showing an irrelevant section
   * every lender would have to explicitly turn off.
   */
  get visibleCollectionSections() {
    return this.collectionSections.filter((sec) => {
      if (sec.key === 'collectSchoolInfo') return this.showSchoolDocs;
      if (sec.key === 'collectCoopInfo') return this.showCoopDocs;
      if (sec.key === 'collectCivilServiceInfo') return this.config.template === 'public';
      if (sec.key === 'collectNyscInfo') return this.showCorperDocs;
      return true;
    });
  }

  get isBnpl(): boolean { return this.config.template === 'bnpl'; }

  readonly bnplCategoryOptions = [
    'Electronics & Gadgets', 'Fashion & Apparel', 'Home Appliances', 'Furniture',
    'Travel & Ticketing', 'Education & Training', 'Health & Wellness',
    'Groceries & Food', 'Automotive', 'Other',
  ];

  toggleBnplCategory(cat: string) {
    const current = this.config.bnplCategories ?? [];
    this.config.bnplCategories = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
  }

  getExpand(key: string): boolean {
    return (this as unknown as Record<string, unknown>)[key] as boolean;
  }

  toggleExpand(key: string) {
    const rec = this as unknown as Record<string, unknown>;
    rec[key] = !rec[key];
  }

  docRows: { key: string; label: string }[] = [
    { key: 'docGovId',            label: 'Government Issued ID' },
    { key: 'docUtilityBill',      label: 'Utility Bill' },
    { key: 'docWorkVerification', label: 'Work Verification Letter' },
    { key: 'docGuarantorForm',    label: 'Guarantor Form' },
  ];

  get conditionalDocRows(): { key: string; label: string }[] {
    const rows: { key: string; label: string }[] = [];
    if (this.showSchoolDocs) {
      rows.push({ key: 'docSchoolId', label: 'School ID Card' });
      rows.push({ key: 'docAdmissionLetter', label: 'Admission Letter' });
    }
    if (this.showCorperDocs) {
      rows.push({ key: 'docNyscLetter', label: 'NYSC Call-Up Letter' });
    }
    if (this.showSmeDocs) {
      rows.push({ key: 'docCacCert', label: 'CAC Certificate' });
    }
    if (this.showCoopDocs) {
      rows.push({ key: 'docMembershipCert', label: 'Membership Certificate' });
      rows.push({ key: 'docMembershipId', label: 'Membership ID Card' });
    }
    return rows;
  }

  weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  monthDays = Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`);

  get showRepaymentDay(): boolean {
    return ['Weekly', 'Bi-weekly', 'Monthly'].includes(this.config.repaymentFrequency);
  }

  get repaymentDayOptions(): string[] {
    if (this.config.repaymentFrequency === 'Monthly') return this.monthDays;
    return this.weekdays;
  }

  get templateLabel(): string {
    const labels: Record<string, string> = {
      salary: 'Salary Advance', public: 'Public Sector', school: 'School Fees',
      corper: 'Corper Loan', sme: 'SME Loan', coop: 'Cooperative',
      bnpl: 'Buy Now Pay Later', scratch: 'Custom',
    };
    return labels[this.config.template] || 'Custom';
  }

  get templateColor(): string {
    const colors: Record<string, string> = {
      salary: '#0BA5EC', public: '#F79009', school: '#12B76A', corper: '#6941C6',
      sme: '#F04438', coop: '#0BA5EC', bnpl: '#D92D20', scratch: '#667085',
    };
    return colors[this.config.template] || '#667085';
  }

  get templateBg(): string {
    const bgs: Record<string, string> = {
      salary: '#E0F2FE', public: '#FEF3C7', school: '#D1FAE5', corper: '#EDE9FE',
      sme: '#FEE4E2', coop: '#E0F2FE', bnpl: '#FEE4E2', scratch: '#F2F4F7',
    };
    return bgs[this.config.template] || '#F2F4F7';
  }
}
