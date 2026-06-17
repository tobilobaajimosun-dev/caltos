import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { TitleCasePipe, LowerCasePipe } from '@angular/common';
import {
  SidebarComponent, CheckboxComponent, RadioButtonComponent,
  ToggleComponent, TextareaComponent,
  CollapsibleSectionComponent, CopyUrlFieldComponent, QrCodeComponent,
  FileUploadComponent,
} from '../../../shared/components';
import { HiIconComponent, IconData } from '../../../shared/components/hi-icon/hi-icon.component';
import { LivePreviewComponent } from './live-preview/live-preview.component';
import {
  ChevronLeftIcon, ChevronRightIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';

export interface LoanConfig {
  template: string;
  // Step 1
  name: string;
  description: string;
  targetAudiences: string[];
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
  docGovId: string;
  docUtilityBill: string;
  docWorkVerification: string;
  docGuarantorForm: string;
  docSchoolId: string;
  docAdmissionLetter: string;
  docNyscLetter: string;
  docCacCert: string;
  docMembershipCert: string;
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
  // Step 5
  disburseTo: string;
  disburseTiming: string;
  offerLetter: boolean;
  namedAccountOnly: boolean;
  repaymentDeductionFirst: boolean;
  videoConfirmation: boolean;
  autoDisburseEnabled: boolean;
  autoDisburseUnder: string;
  // Step 6
  repaymentFrequency: string;
  firstRepaymentDays: string;
  repaymentDay: string;
  minRepayments: string;
  maxRepayments: string;
  moveFirstRepaymentDays: string;
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
}

export const STEPS = [
  { id: 'about',         label: 'About this Loan',         shortLabel: 'About Loan' },
  { id: 'application',   label: 'Set Up Your Application', shortLabel: 'Application' },
  { id: 'verification',  label: 'Verification',            shortLabel: 'Verification' },
  { id: 'pricing',       label: 'Pricing & Fees',          shortLabel: 'Pricing' },
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
    incomeRemita: true, incomeIppis: false, incomeBankStatement: true,
    docGovId: 'required', docUtilityBill: 'optional', docWorkVerification: 'required',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none',
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
    docGovId: 'required', docUtilityBill: 'optional', docWorkVerification: 'required',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none',
    disburseTo: 'bank', namedAccountOnly: true, repaymentFrequency: 'Monthly',
    welcomeMessage: 'Welcome! Loans designed specifically for civil servants. Get started in minutes.',
  },
  school: {
    name: 'School Fees Loan',
    description: 'Help families pay school fees and educational expenses.',
    entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: false, collectAddress: true, collectBusiness: false,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: false, incomeIppis: false, incomeBankStatement: true,
    docGovId: 'required', docUtilityBill: 'optional', docWorkVerification: 'none',
    docGuarantorForm: 'required', docSchoolId: 'required', docAdmissionLetter: 'required',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none',
    disburseTo: 'bank', repaymentFrequency: 'Monthly',
    welcomeMessage: 'Welcome! Fund your education without the financial stress. Apply in minutes.',
  },
  corper: {
    name: 'Corper Wallet Loan',
    description: 'Quick loans for NYSC corps members throughout their service year.',
    entryPhone: true, entryEmail: false, entryBvn: true, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: true, collectAddress: false, collectBusiness: false,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: true, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: true, incomeIppis: false, incomeBankStatement: false,
    docGovId: 'required', docUtilityBill: 'none', docWorkVerification: 'none',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'required', docCacCert: 'none', docMembershipCert: 'none',
    disburseTo: 'bank', repaymentFrequency: 'Monthly',
    welcomeMessage: 'Welcome, corps member! Quick loans to support your NYSC service year.',
  },
  sme: {
    name: 'SME Working Capital Loan',
    description: 'Working capital and growth financing for registered businesses.',
    entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: true, collectAddress: true, collectBusiness: true,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: true, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: false, incomeIppis: false, incomeBankStatement: true,
    docGovId: 'required', docUtilityBill: 'required', docWorkVerification: 'optional',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'required', docMembershipCert: 'none',
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
    docGovId: 'required', docUtilityBill: 'none', docWorkVerification: 'none',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'required',
    disburseTo: 'bank', repaymentFrequency: 'Monthly',
    welcomeMessage: 'Welcome, member! Access your cooperative loan benefits quickly and easily.',
  },
  bnpl: {
    name: 'Buy Now Pay Later',
    description: 'Instant purchase financing that lets customers shop and pay over time.',
    entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: false, collectAddress: true, collectBusiness: false,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: false, incomeIppis: false, incomeBankStatement: true,
    docGovId: 'required', docUtilityBill: 'none', docWorkVerification: 'none',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none',
    disburseTo: 'third-party', repaymentFrequency: 'Weekly',
    welcomeMessage: 'Shop now, pay later. Get instant purchase financing with no hidden fees.',
  },
  scratch: {},
};

@Component({
  selector: 'app-create-loan',
  standalone: true,
  imports: [
    FormsModule, RouterLink, TitleCasePipe, LowerCasePipe,
    SidebarComponent, HiIconComponent,
    CheckboxComponent, RadioButtonComponent, ToggleComponent,
    TextareaComponent, CollapsibleSectionComponent,
    CopyUrlFieldComponent, QrCodeComponent,
    FileUploadComponent, LivePreviewComponent,
  ],
  templateUrl: './create-loan.component.html',
  styleUrls: ['./create-loan.component.scss'],
})
export class CreateLoanComponent implements OnInit {
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

  showInsuranceFee = false;
  showAdminFee = false;
  showMgmtFee = false;

  isPublished = false;
  showCustomFeeModal = false;
  customFeeName = '';
  customFeeType = 'Percentage';
  customFeeRate = '';
  customFees: { name: string; type: string; rate: string }[] = [];

  showCustomFieldModal = false;
  customFieldLabel = '';
  customFieldType = 'Text';
  customFieldRequired = 'required';
  customFields: { label: string; type: string; required: string }[] = [];

  showRemoveCustomFieldModal = false;
  removeCustomFieldIndex = -1;
  recommendedCustomFields: { label: string; type: string }[] = [];

  repaymentOrder = ['Fees', 'Interest', 'Penalty', 'Principal'];
  dragIndex = -1;
  dragOverIndex = -1;

  readonly chevronLeft: IconData = ChevronLeftIcon as IconData;
  readonly chevronRight: IconData = ChevronRightIcon as IconData;
  readonly plusIcon: IconData = PlusSignIcon as IconData;

  readonly audiences = [
    'Everyone', 'Salary Earners', 'Public Servants',
    'Students', 'Business Owners', 'Cooperative Members',
    'Existing Customers', 'Custom Audience',
  ];

  readonly tenorUnits = ['Days', 'Weeks', 'Months', 'Years'];
  readonly repayFreqs = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'At end of tenor'];
  readonly interestModels = ['Flat Rate', 'Reducing Balance', 'Percentage Based'];
  readonly interestChargePeriods = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'One Time'];

  config: LoanConfig = {
    template: '', name: '', description: '', targetAudiences: [],
    minAmount: '', maxAmount: '', minTenor: '', maxTenor: '', tenorUnit: 'Months',
    interestModel: 'Flat Rate', interestRate: '', interestChargedWhen: 'Monthly', minAge: '18', maxAge: '',
    entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
    collectPersonal: true, collectContact: true, collectAddress: false,
    collectEmployment: false, collectBusiness: false,
    allowContinue: true, recogniseExisting: true,
    identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: false, incomeIppis: false, incomeBankStatement: false,
    docGovId: 'none', docUtilityBill: 'none', docWorkVerification: 'none',
    docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
    docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none',
    processingFeeType: 'Percentage', processingFeeRate: '', processingFeeApplicableTo: 'Loan Amount',
    processingFeeMin: '', processingFeeMax: '',
    latePenaltyMethod: 'Percentage', latePenaltyRate: '', latePenaltyGraceDays: '3',
    latePenaltyApplyTo: 'Outstanding Balance',
    disburseTo: 'bank', disburseTiming: 'instant',
    offerLetter: false, namedAccountOnly: false, repaymentDeductionFirst: false, videoConfirmation: false,
    autoDisburseEnabled: false, autoDisburseUnder: '',
    repaymentFrequency: 'Monthly', firstRepaymentDays: '30', repaymentDay: 'Day 30',
    minRepayments: '', maxRepayments: '', moveFirstRepaymentDays: '',
    docTerms: '', docPrivacy: '', docAgreement: '', useDefaultConsent: false,
    welcomeMessage: '', thankYouMessage: '', supportEmail: 'hello@yourcompany.ng',
    supportPhone: '', whatsappContact: '',
    brandColor: '#6941C6', brandName: '',
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const type = params['type'];
      if (type && TEMPLATE_PRESETS[type]) {
        const preset = TEMPLATE_PRESETS[type];
        this.config = { ...this.config, ...preset, template: type };
      }
    });
    this.loadRecommendedCustomFields();
  }

  private loadRecommendedCustomFields() {
    try {
      const raw = localStorage.getItem('caltos_custom_fields_history');
      if (raw) this.recommendedCustomFields = JSON.parse(raw);
    } catch {}
  }

  addRecommendedCustomField(field: { label: string; type: string }) {
    if (this.customFields.some(f => f.label === field.label)) return;
    this.customFields.push({ label: field.label, type: field.type, required: 'required' });
  }

  confirmRemoveCustomField(i: number) {
    this.removeCustomFieldIndex = i;
    this.showRemoveCustomFieldModal = true;
  }

  executeRemoveCustomField() {
    if (this.removeCustomFieldIndex >= 0) this.customFields.splice(this.removeCustomFieldIndex, 1);
    this.showRemoveCustomFieldModal = false;
    this.removeCustomFieldIndex = -1;
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

  stepStatus(i: number): 'active' | 'done' | 'upcoming' {
    if (i === this.currentStep) return 'active';
    return i < this.currentStep ? 'done' : 'upcoming';
  }

  next() { if (!this.isLast) this.currentStep++; }
  back() { if (!this.isFirst) this.currentStep--; }
  goToStep(i: number) { this.currentStep = i; }

  saveDraft() {
    this.isDraft = true;
    this.showUnsavedDialog = false;
  }

  discardAndLeave() {
    this.showUnsavedDialog = false;
    this.router.navigate(['/products']);
  }

  publish() {
    localStorage.setItem('caltos_published_config', JSON.stringify(this.config));
    this.isPublished = true;
    this.isDraft = false;
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

  get publishUrl(): string {
    const slug = (this.config.name || 'my-loan').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `https://apply.caltos.co/${slug}`;
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
    const newField = { label: this.customFieldLabel, type: this.customFieldType, required: this.customFieldRequired };
    this.customFields.push(newField);
    // Save to history for recommendations in future sessions
    const history = this.recommendedCustomFields;
    if (!history.some(f => f.label === newField.label)) {
      history.push({ label: newField.label, type: newField.type });
      localStorage.setItem('caltos_custom_fields_history', JSON.stringify(history));
      this.recommendedCustomFields = [...history];
    }
    this.customFieldLabel = ''; this.customFieldType = 'Text'; this.customFieldRequired = 'required';
    this.showCustomFieldModal = false;
  }

  removeCustomField(i: number) { this.customFields.splice(i, 1); }

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

  collectionSections = [
    { key: 'collectPersonal',    label: 'Personal Information',    count: '5',
      fields: ['First Name', 'Middle Name', 'Last Name', 'Date of Birth', 'Gender'],
      expand: 'expandPersonal' },
    { key: 'collectContact',     label: 'Contact Information',     count: '4',
      fields: ['Email Address', 'Phone Number', 'WhatsApp Number', 'Preferred Contact'],
      expand: 'expandContact' },
    { key: 'collectAddress',     label: 'Address Information',     count: '5',
      fields: ['Street Address', 'City', 'State', 'LGA', 'Landmark'],
      expand: 'expandAddress' },
    { key: 'collectEmployment',  label: 'Employment Information',  count: '5',
      fields: ['Employer Name', 'Staff ID', 'Job Title', 'Monthly Salary', 'Employment Type'],
      expand: 'expandEmployment' },
    { key: 'collectBusiness',    label: 'Business Information',    count: '4',
      fields: ['Business Name', 'CAC Number', 'Business Type', 'Annual Revenue'],
      expand: 'expandBusiness' },
  ];

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
