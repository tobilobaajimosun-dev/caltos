import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import {
  ToggleComponent, TextareaComponent, FileUploadComponent,
} from '../../../shared/components';
import { HiIconComponent, IconData } from '../../../shared/components/hi-icon/hi-icon.component';
import {
  ChevronLeftIcon, ChevronRightIcon, PlusSignIcon, EyeIcon, Clock01Icon,
} from '@hugeicons/core-free-icons';

const BNPL_STEPS = [
  { id: 'about',         label: 'About this BNPL Product',     shortLabel: 'About' },
  { id: 'categories',   label: 'Eligible Categories & Limits', shortLabel: 'Categories' },
  { id: 'verification', label: 'Verification',                  shortLabel: 'Verification' },
  { id: 'pricing',      label: 'Pricing & Fees',                shortLabel: 'Pricing' },
  { id: 'repayment',    label: 'Repayment',                     shortLabel: 'Repayment' },
  { id: 'disbursement', label: 'Disbursement',                  shortLabel: 'Disbursement' },
  { id: 'legal',        label: 'Legal',                         shortLabel: 'Legal' },
  { id: 'customisation', label: 'Customisation',                shortLabel: 'Customise' },
  { id: 'review',       label: 'Review & Publish',              shortLabel: 'Review' },
];

interface BnplConfig {
  name: string;
  description: string;
  minPurchaseAmount: string;
  maxPurchaseAmount: string;
  interestModel: string;
  interestRate: string;
  interestFrequency: string;
  minAge: string;
  maxAge: string;
  eligibleCategories: string[];
  customCategory: string;
  defaultVendorLimit: string;
  purchaseMode: string;
  identityBvn: boolean;
  identityNin: boolean;
  identityPhoneOtp: boolean;
  identityEmailOtp: boolean;
  affordabilityBankStatement: boolean;
  affordabilityRemita: boolean;
  affordabilityIppis: boolean;
  affordabilitySelfDeclared: boolean;
  docGovId: string;
  docUtilityBill: string;
  docProofOfIncome: string;
  processingFeeType: string;
  processingFeeRate: string;
  processingFeeApplicableTo: string;
  processingFeeMin: string;
  processingFeeMax: string;
  showInsuranceFee: boolean;
  showAdminFee: boolean;
  latePenaltyMethod: string;
  latePenaltyRate: string;
  latePenaltyMin: string;
  latePenaltyMax: string;
  latePenaltyGraceDays: string;
  latePenaltyApplyTo: string;
  repaymentFrequency: string;
  minRepaymentPeriod: string;
  minRepaymentUnit: string;
  maxRepaymentPeriod: string;
  maxRepaymentUnit: string;
  firstRepaymentDays: string;
  repaymentDay: string;
  disbursementTiming: string;
  offerLetter: boolean;
  repaymentDeductionFirst: boolean;
  useDefaultConsent: boolean;
  welcomeMessage: string;
  thankYouMessage: string;
  notEligibleMessage: string;
  supportEmail: string;
  supportPhone: string;
  whatsappContact: string;
  brandColor: string;
  brandName: string;
}

@Component({
  selector: 'app-create-bnpl',
  standalone: true,
  imports: [
    FormsModule, RouterLink, TitleCasePipe,
    HiIconComponent,
    ToggleComponent, TextareaComponent, FileUploadComponent,
  ],
  templateUrl: './create-bnpl.component.html',
  styleUrls: ['./create-bnpl.component.scss'],
})
export class CreateBnplComponent {
  readonly steps = BNPL_STEPS;
  currentStep = 0;
  isDraft = false;
  isPublished = false;
  pricingTab: 'fees' | 'penalties' = 'fees';
  nameAvailable = false;
  nameCheckTimeout: ReturnType<typeof setTimeout> | null = null;
  showCustomFeeModal = false;
  customFeeName = '';
  customFeeType = 'Percentage';
  customFeeRate = '';
  customFees: { name: string; type: string; rate: string }[] = [];
  showConsentText = false;

  readonly categories = [
    'Electronics & Gadgets',
    'Fashion & Clothing',
    'Food & Groceries',
    'Education & School Supplies',
    'Health & Wellness',
    'Home & Furniture',
    'Travel & Experiences',
    'Agricultural Inputs',
    'Building Materials',
    'Automotive Parts',
  ];

  readonly interestModels = ['Flat Rate', 'Reducing Balance'];
  readonly interestFrequencies = ['Daily', 'Weekly', 'Monthly', 'One Time'];
  readonly repayFreqs = ['Weekly', 'Bi-weekly', 'Monthly', 'At end of tenor'];
  readonly periodUnits = ['Days', 'Weeks', 'Months'];
  readonly weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  readonly monthDays = Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`);

  readonly docRows = [
    { key: 'docGovId',         label: 'Government Issued ID' },
    { key: 'docUtilityBill',   label: 'Utility Bill' },
    { key: 'docProofOfIncome', label: 'Proof of Income' },
  ];

  readonly chevronLeft: IconData = ChevronLeftIcon as IconData;
  readonly chevronRight: IconData = ChevronRightIcon as IconData;
  readonly plusIcon: IconData = PlusSignIcon as IconData;
  readonly eyeIcon: IconData = EyeIcon as IconData;
  readonly clockIcon: IconData = Clock01Icon as IconData;

  config: BnplConfig = {
    name: '',
    description: 'Instant purchase financing for goods and services. Customers shop now and repay in instalments.',
    minPurchaseAmount: '',
    maxPurchaseAmount: '',
    interestModel: 'Flat Rate',
    interestRate: '',
    interestFrequency: 'Monthly',
    minAge: '18',
    maxAge: '',
    eligibleCategories: [],
    customCategory: '',
    defaultVendorLimit: '',
    purchaseMode: 'amount',
    identityBvn: true,
    identityNin: false,
    identityPhoneOtp: true,
    identityEmailOtp: false,
    affordabilityBankStatement: false,
    affordabilityRemita: false,
    affordabilityIppis: false,
    affordabilitySelfDeclared: false,
    docGovId: 'required',
    docUtilityBill: 'optional',
    docProofOfIncome: 'none',
    processingFeeType: 'Percentage',
    processingFeeRate: '',
    processingFeeApplicableTo: 'Purchase Amount',
    processingFeeMin: '',
    processingFeeMax: '',
    showInsuranceFee: false,
    showAdminFee: false,
    latePenaltyMethod: 'Percentage',
    latePenaltyRate: '',
    latePenaltyMin: '',
    latePenaltyMax: '',
    latePenaltyGraceDays: '3',
    latePenaltyApplyTo: 'Outstanding Balance',
    repaymentFrequency: 'Monthly',
    minRepaymentPeriod: '',
    minRepaymentUnit: 'Months',
    maxRepaymentPeriod: '',
    maxRepaymentUnit: 'Months',
    firstRepaymentDays: '30',
    repaymentDay: 'Day 1',
    disbursementTiming: 'instant',
    offerLetter: false,
    repaymentDeductionFirst: false,
    useDefaultConsent: false,
    welcomeMessage: '',
    thankYouMessage: '',
    notEligibleMessage: '',
    supportEmail: 'hello@yourcompany.ng',
    supportPhone: '',
    whatsappContact: '',
    brandColor: '#D92D20',
    brandName: '',
  };

  constructor() {}

  get stepId() { return this.steps[this.currentStep].id; }
  get isFirst() { return this.currentStep === 0; }
  get isLast() { return this.currentStep === this.steps.length - 1; }

  next() { if (!this.isLast) this.currentStep++; }
  back() { if (!this.isFirst) this.currentStep--; }
  goToStep(i: number) { this.currentStep = i; }

  stepStatus(i: number): 'active' | 'done' | 'upcoming' {
    if (i === this.currentStep) return 'active';
    return i < this.currentStep ? 'done' : 'upcoming';
  }

  saveDraft() { this.isDraft = true; }

  publish() {
    this.isPublished = true;
    this.isDraft = false;
  }

  onNameChange(val: string) {
    this.config.name = val;
    this.nameAvailable = false;
    if (this.nameCheckTimeout) clearTimeout(this.nameCheckTimeout);
    if (val.trim().length > 2) {
      this.nameCheckTimeout = setTimeout(() => { this.nameAvailable = true; }, 500);
    }
  }

  toggleCategory(cat: string) {
    const idx = this.config.eligibleCategories.indexOf(cat);
    if (idx >= 0) {
      this.config.eligibleCategories = this.config.eligibleCategories.filter(c => c !== cat);
    } else {
      this.config.eligibleCategories = [...this.config.eligibleCategories, cat];
    }
  }

  getDocReq(key: string): string {
    return (this.config as unknown as Record<string, string>)[key] ?? 'none';
  }

  setDocReq(key: string, val: string) {
    (this.config as unknown as Record<string, string>)[key] = val;
  }

  get showRepaymentDay(): boolean {
    return ['Weekly', 'Bi-weekly', 'Monthly'].includes(this.config.repaymentFrequency);
  }

  get repaymentDayOptions(): string[] {
    return this.config.repaymentFrequency === 'Monthly' ? this.monthDays : this.weekdays;
  }

  get publishUrl(): string {
    const lenderSlug = 'princeps';
    const productSlug = (this.config.name || 'my-bnpl').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `https://apply.caltos.co/${lenderSlug}/bnpl/${productSlug}/[vendor-slug]`;
  }

  get descLength(): number { return this.config.description?.length ?? 0; }

  addCustomFee() {
    if (!this.customFeeName.trim()) return;
    this.customFees.push({ name: this.customFeeName, type: this.customFeeType, rate: this.customFeeRate });
    this.customFeeName = ''; this.customFeeType = 'Percentage'; this.customFeeRate = '';
    this.showCustomFeeModal = false;
  }

  removeCustomFee(i: number) { this.customFees.splice(i, 1); }

  reviewSections = [
    { title: 'Product Details',      subtitle: 'Name, description, purchase limits, interest' },
    { title: 'Eligible Categories',  subtitle: 'Product categories, vendor limit, purchase mode' },
    { title: 'Verification',         subtitle: 'Identity, affordability, documents' },
    { title: 'Pricing & Fees',      subtitle: 'Processing fee, penalties' },
    { title: 'Repayment',           subtitle: 'Frequency, duration, first repayment' },
    { title: 'Disbursement',        subtitle: 'Timing, rules' },
    { title: 'Legal',               subtitle: 'Documents and consent' },
    { title: 'Customisation',       subtitle: 'Brand, messaging, support' },
  ];

  reviewExpanded: boolean[] = [true, false, false, false, false, false, false, false];
  toggleReview(i: number) { this.reviewExpanded[i] = !this.reviewExpanded[i]; }

  compact(arr: string[]): string { return arr.filter(s => s).join(', ') || '—'; }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.config.name) event.preventDefault();
  }
}
