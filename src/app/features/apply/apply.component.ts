import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoanConfig } from '../loans/create-loan/create-loan.component';
import { LoansService } from '../../shared/services/loans.service';
import { ProductsService } from '../../shared/services/products.service';
import { OrgBrandingService } from '../../shared/services/org-branding.service';
import {
  scoreEligibility, EligibilityInput, EligibilityConfig, EligibilityResult,
  EmploymentStabilityInput, IncomeSource, DEFAULT_ELIGIBILITY_CONFIG,
} from '../../shared/utils/eligibility-scoring';
import { formatThousands } from '../../shared/utils/number-format';

// Default fallback config (salary advance) used when no published product is in localStorage
const FALLBACK_CONFIG: LoanConfig = {
  template: 'salary',
  name: 'Salary Advance Loan',
  description: 'Quick access to earned wages for private sector employees.',
  targetAudiences: ['Salary Earners'], audienceMode: 'custom',
  minAmount: '10000', maxAmount: '500000',
  minTenor: '1', maxTenor: '12', tenorUnit: 'Months',
  interestModel: 'Flat Rate', interestRate: '2.5', interestChargedWhen: 'Monthly',
  minAge: '18', maxAge: '',
  entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
  collectPersonal: true, collectContact: true, collectAddress: false,
  collectEmployment: true, collectBusiness: false, collectBank: false,
  allowContinue: true, recogniseExisting: true,
  identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
  incomeRemita: true, incomeIppis: false, incomeBankStatement: true,
  deductIppis: false, deductRemita: true, deductDedukt: false, deductWacs: false,
  deductRemitaDirectDebit: true, deductMonoDirectDebit: false,
  docGovId: 'required', docUtilityBill: 'optional', docWorkVerification: 'required',
  docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
  docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none',
  processingFeeType: 'Percentage', processingFeeRate: '1.5',
  processingFeeApplicableTo: 'Loan Amount', processingFeeMin: '', processingFeeMax: '',
  latePenaltyMethod: 'Percentage', latePenaltyRate: '2', latePenaltyGraceDays: '3',
  latePenaltyApplyTo: 'Outstanding Balance',
  latePenaltyChargeFrequency: 'Daily', latePenaltyApplicationTiming: 'During Loan Tenor',
  latePenaltyParallelAccrual: false, latePenaltyIncludeGraceInRecurring: false,
  latePenaltyAccrualStopCondition: 'Never',
  latePenaltyMaxCapEnabled: false, latePenaltyMaxCapChargeType: 'Percentage',
  latePenaltyMaxCapChargeValue: '', latePenaltyMaxCapChargeBase: 'Outstanding Balance',
  disburseTo: 'bank', disburseTiming: 'instant',
  offerLetter: false, namedAccountOnly: true, repaymentDeductionFirst: false,
  videoConfirmation: false, autoDisburseEnabled: false, autoDisburseUnder: '',
  restrictActiveLoan: false, activeLoanPolicy: 'block',
  repaymentFrequency: 'Monthly', firstRepaymentDays: '30', repaymentDay: 'Day 30',
  repaymentDayRangeStart: '28', repaymentDayRangeEnd: '31',
  minRepayments: '', maxRepayments: '', moveFirstRepaymentDayOfMonth: '',
  docTerms: '', docPrivacy: '', docAgreement: '', useDefaultConsent: true,
  welcomeMessage: 'Welcome! Get quick access to your salary in advance. The process takes about 5 minutes.',
  thankYouMessage: '', supportEmail: 'hello@caltos.ng', supportPhone: '', whatsappContact: '',
  brandColor: '#6941C6', brandName: '',
};

interface StepDef { id: string; label: string; }

interface DocField {
  key: string;
  label: string;
  sub: string;
  required: boolean;
}

export type IdentityFieldType = 'bvn' | 'nin' | 'phone' | 'email';

interface IdentityField {
  type: IdentityFieldType;
  label: string;
  otpDestinationCopy: string;
}

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './apply.component.html',
  styleUrls: ['./apply.component.scss'],
})
export class ApplyComponent implements OnInit, OnDestroy {
  Math = Math;

  private readonly loansService = inject(LoansService);
  private readonly productsService = inject(ProductsService);
  private readonly orgBranding = inject(OrgBrandingService);

  // ── Product config ──────────────────────────────────────────────────────────
  product: LoanConfig = FALLBACK_CONFIG;
  configSource: 'localStorage' | 'fallback' = 'fallback';
  resolvedProductId = '';

  get orgLogoDataUrl() { return this.orgBranding.branding().logoDataUrl; }

  // ── Dynamic steps ───────────────────────────────────────────────────────────
  steps: StepDef[] = [];
  stepIndex = 0;
  submitted = false;
  refNumber = 'CLT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // ── Computed from config ────────────────────────────────────────────────────
  amountMin = 10000;
  amountMax = 500000;
  tenorOptions: number[] = [];
  incomeOptions: { id: string; label: string; tag: string; desc: string; color: string }[] = [];
  docFields: DocField[] = [];

  // ── Form state: entry ───────────────────────────────────────────────────────
  entryPhone = '';
  entryEmail = '';
  entryBvn = '';
  entryNin = '';

  // ── Form state: loan details ────────────────────────────────────────────────
  loanAmount = '150000';
  loanTenor = '3';
  loanPurpose = '';

  // ── Form state: personal (auto-derived from BVN/NIN verification) ──────────
  firstName = '';
  lastName = '';
  dob = '';
  gender = '';

  // ── Form state: contact ─────────────────────────────────────────────────────
  phone = '';
  email = '';

  // ── Form state: income & employment (folded into one step) ─────────────────
  employerName = '';
  employmentType = '';
  monthlyIncome = '';
  staffId = '';
  incomeChannel = '';

  /** True when the product offers IPPIS/Remita income verification — for these, work details
   * come from the channel's own "Verify" lookup instead of asking employment type/employer. */
  get isPayrollVerifiedIncome(): boolean {
    return !!(this.product.incomeIppis || this.product.incomeRemita);
  }

  ippisNumber = '';
  ippisVerifying = false;
  ippisVerified = false;

  bankAccountName = '';
  remitaVerifying = false;
  remitaVerified = false;

  verifyIppis() {
    if (!this.ippisNumber) return;
    this.ippisVerifying = true;
    setTimeout(() => {
      this.ippisVerifying = false;
      this.ippisVerified = true;
      this.employerName = 'Federal Ministry of Works';
      this.cdr.markForCheck();
    }, 1200);
  }

  verifyRemita() {
    if (!this.bankAccountNumber || !this.bankName) return;
    this.remitaVerifying = true;
    setTimeout(() => {
      this.remitaVerifying = false;
      this.remitaVerified = true;
      this.bankAccountName = 'Aisha Bello';
      this.employerName = this.employerName || 'Lagos State Government';
      this.cdr.markForCheck();
    }, 1200);
  }

  get incomeStepCanContinue(): boolean {
    if (!this.monthlyIncome) return false;
    if (this.incomeChannel === 'ippis') return this.ippisVerified;
    if (this.incomeChannel === 'remita') return this.remitaVerified;
    if (this.isPayrollVerifiedIncome) return true;
    return !!this.employmentType && !!this.employerName;
  }

  /** Displays a plain-digit amount field with thousand separators. */
  formatAmount(value: string): string { return formatThousands(value); }

  /** Strips non-digits before storing — the field itself stays a plain number string; only display gets commas. */
  onMoneyInput(field: 'monthlyIncome', raw: string) {
    this[field] = raw.replace(/[^\d]/g, '');
  }

  /** `08012345678` -> `+2348012345678` — strips the leading trunk `0` before prefixing `+234`. */
  formatPhoneDisplay(raw: string): string {
    if (!raw) return '';
    return '+234' + raw.replace(/^0/, '');
  }

  formatDob(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Form state: identity verification ───────────────────────────────────────
  bvn = '';
  nin = '';

  get pendingIdentityFields(): IdentityField[] {
    const p = this.product;
    const list: IdentityField[] = [];
    if (p.identityBvn && !p.entryBvn) list.push({ type: 'bvn', label: 'BVN', otpDestinationCopy: 'your BVN-registered phone number' });
    if (p.identityNin && !p.entryNin) list.push({ type: 'nin', label: 'NIN', otpDestinationCopy: 'your NIN-registered phone number' });
    if (p.identityPhoneOtp && !p.entryPhone) list.push({ type: 'phone', label: 'Phone', otpDestinationCopy: this.formatPhoneDisplay(this.phone) || 'your phone number' });
    if (p.identityEmailOtp && !p.entryEmail) list.push({ type: 'email', label: 'Email', otpDestinationCopy: this.email || 'your email address' });
    return list;
  }

  identityQueueIndex = 0;

  isIdentityFieldUnlocked(i: number): boolean { return i <= this.identityQueueIndex; }
  isIdentityFieldVerified(i: number): boolean { return i < this.identityQueueIndex; }

  identityFieldValue(type: IdentityFieldType): string {
    return type === 'bvn' ? this.bvn : type === 'nin' ? this.nin : type === 'phone' ? this.phone : this.email;
  }

  setIdentityFieldValue(type: IdentityFieldType, value: string) {
    if (type === 'bvn') this.bvn = value;
    else if (type === 'nin') this.nin = value;
    else if (type === 'phone') this.phone = value;
    else this.email = value;
  }

  identityFieldReady(field: IdentityField): boolean {
    const value = this.identityFieldValue(field.type);
    return field.type === 'bvn' || field.type === 'nin' ? value.length === 11 : value.trim().length > 0;
  }

  // ── OTP modal (shared across identity fields) ───────────────────────────────
  otpModalOpen = false;
  otpModalDestinationCopy = '';
  otpModalCode = '';
  private otpModalFieldIndex = -1;

  openIdentityOtp(index: number) {
    const field = this.pendingIdentityFields[index];
    if (!field) return;
    this.otpModalFieldIndex = index;
    this.otpModalDestinationCopy = field.otpDestinationCopy;
    this.otpModalCode = '';
    this.otpModalOpen = true;
  }

  closeOtpModal() {
    this.otpModalOpen = false;
    this.otpModalFieldIndex = -1;
  }

  verifyOtpModal() {
    // Demo OTP, matching the app's existing convention elsewhere (e.g. login's 2FA step).
    if (this.otpModalCode !== '123456') return;
    if (this.otpModalFieldIndex === this.identityQueueIndex) {
      this.identityQueueIndex++;
      if (this.identityQueueIndex >= this.pendingIdentityFields.length) {
        this.deriveIdentityFromVerification();
      }
    }
    this.closeOtpModal();
  }

  /**
   * No personal-info step exists anymore — a BVN/NIN lookup realistically returns bio-data,
   * so once identity verification clears, backfill name/DOB with a mocked lookup response
   * (only if not already set) rather than asking the borrower to retype it.
   */
  private deriveIdentityFromVerification() {
    if (!this.firstName) this.firstName = 'Aisha';
    if (!this.lastName) this.lastName = 'Bello';
    if (!this.dob) this.dob = '1990-01-01';
  }

  // ── Eligibility ──────────────────────────────────────────────────────────────
  isCalculatingEligibility = false;
  eligibilityResult: EligibilityResult | null = null;

  private mapEmploymentStability(): EmploymentStabilityInput {
    if (/nysc|corper|corps/i.test(this.employmentType)) {
      return { type: 'nysc-corper', monthsRemaining: 9 };
    }
    const category = this.employmentType === 'Self-employed' ? 'self-employed'
      : this.employmentType === 'Contract' ? 'sme'
      : 'private-large';
    return { type: 'mda', category };
  }

  calculateEligibility() {
    this.isCalculatingEligibility = true;
    const eligibilityInput: EligibilityInput = {
      income: { source: (this.incomeChannel as IncomeSource) || 'other', monthlyAmount: +this.monthlyIncome || 0 },
      stability: this.mapEmploymentStability(),
      repaymentHistory: { isRepeatBorrower: false },
      exposure: { hasActiveLoanElsewhere: false },
    };
    const config: EligibilityConfig = {
      ...DEFAULT_ELIGIBILITY_CONFIG,
      productMaxAmount: this.amountMax,
      productMaxTenorMonths: +(this.product.maxTenor || 12),
      productMinTenorMonths: +(this.product.minTenor || 1),
    };
    // Simulated processing delay — matches the app's existing fake-backend timing conventions.
    setTimeout(() => {
      const result = scoreEligibility(eligibilityInput, config);
      this.eligibilityResult = result;
      this.isCalculatingEligibility = false;
      if (result.decision === 'approved') {
        // Default to the maximum amount at the maximum duration — the borrower can only edit down from here.
        this.loanAmount = String(result.maxEligibleAmount);
        this.loanTenor = String(result.tenorMonths);
      }
      this.next();
      this.cdr.markForCheck();
    }, 1500);
  }

  // ── Documents: mock per-file verification ───────────────────────────────────
  verifyingDocs: Record<string, boolean> = {};
  verifiedDocs: Record<string, boolean> = {};

  // ── Legal ────────────────────────────────────────────────────────────────────
  legalConsentAccepted = false;
  legalCreditCheckAccepted = false;

  // ── Form state: bank account details (kept for LoanApplication fields, no dedicated step) ──
  bankName = '';
  bankAccountNumber = '';

  // ── Form state: identity ────────────────────────────────────────────────────
  otpSent = false;
  otp = '';

  // ── Form state: documents ───────────────────────────────────────────────────
  uploadedDocs: Record<string, { file: File; name: string } | null> = {};

  // True until loadProduct()/buildDerivedData()/buildSteps() finish — the template's first
  // render happens before this async work resolves, so it renders a minimal shell instead of
  // referencing `steps`/derived state that isn't populated yet.
  loading = true;

  async ngOnInit() {
    try {
      await this.loadProduct();
      this.buildDerivedData();
      this.buildSteps();
    } catch (e) {
      console.error('ApplyComponent failed to initialize', e);
    } finally {
      this.loading = false;
      // This app runs zoneless — the continuation after `await` isn't an Angular-tracked
      // event, so nothing repaints the view on its own without an explicit nudge here.
      this.cdr.markForCheck();
    }
  }

  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Load config, keyed by the ?product= query param ─────────────────────────
  private async loadProduct() {
    await this.productsService.ready;
    const productId = this.route.snapshot.queryParamMap.get('product');
    try {
      const raw = productId ? await this.productsService.getPublishedConfig(productId) : undefined;
      const record = productId ? this.productsService.getById(productId) : undefined;
      if (raw && productId) {
        this.product = { ...FALLBACK_CONFIG, ...raw } as LoanConfig;
        this.configSource = 'localStorage';
        this.resolvedProductId = productId;
      } else if (record) {
        this.product = {
          ...FALLBACK_CONFIG,
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
          bannerImageDataUrl: record.bannerImageDataUrl,
        };
        this.configSource = 'localStorage';
        this.resolvedProductId = productId!;
      } else {
        this.product = FALLBACK_CONFIG;
        this.configSource = 'fallback';
        this.resolvedProductId = productId ?? this.productsService.products().find((p) => p.status === 'live')?.id ?? '';
      }
    } catch {
      this.product = FALLBACK_CONFIG;
      this.configSource = 'fallback';
      this.resolvedProductId = this.productsService.products().find((p) => p.status === 'live')?.id ?? '';
    }
  }

  // ── Derive amount/tenor/income/docs from config ─────────────────────────────
  private buildDerivedData() {
    const p = this.product;

    this.amountMin = +(p.minAmount || 10000);
    this.amountMax = +(p.maxAmount || 500000);
    this.loanAmount = String(Math.round((this.amountMin + this.amountMax) / 2 / 1000) * 1000);

    const minT = +(p.minTenor || 1);
    const maxT = +(p.maxTenor || 12);
    const presets = [1, 2, 3, 6, 9, 12].filter((m) => m >= minT && m <= maxT);
    this.tenorOptions = presets.length ? presets : [minT, maxT].filter((v, i, a) => a.indexOf(v) === i);
    this.loanTenor = String(this.tenorOptions[0] ?? minT);

    this.incomeOptions = [];
    if (p.incomeRemita) this.incomeOptions.push({ id: 'remita', label: 'Remita', tag: 'Instant', desc: 'For government & corporate employees', color: 'green' });
    if (p.incomeIppis) this.incomeOptions.push({ id: 'ippis', label: 'IPPIS', tag: 'Instant', desc: 'Government payroll system', color: 'blue' });
    if (p.incomeBankStatement) this.incomeOptions.push({ id: 'bank', label: 'Bank Statement', tag: '3–6 hrs', desc: 'Upload a 3-month bank statement', color: 'yellow' });
    if (this.incomeOptions.length) this.incomeChannel = this.incomeOptions[0].id;

    const allDocs: { key: keyof LoanConfig; label: string; sub: string }[] = [
      { key: 'docGovId', label: 'Government-issued ID', sub: 'National ID · Voter\'s Card · Driver\'s Licence · Passport' },
      { key: 'docUtilityBill', label: 'Utility bill', sub: 'Recent (within 3 months) electricity, water or DSTV bill' },
      { key: 'docWorkVerification', label: 'Work verification', sub: 'Employment letter, staff ID or company registration' },
      { key: 'docGuarantorForm', label: 'Guarantor form', sub: 'Signed form from an approved guarantor' },
      { key: 'docSchoolId', label: 'School ID', sub: 'Valid school identification card' },
      { key: 'docAdmissionLetter', label: 'Admission letter', sub: 'Letter of admission from your institution' },
      { key: 'docNyscLetter', label: 'NYSC call-up letter', sub: 'Original NYSC call-up or posting letter' },
      { key: 'docCacCert', label: 'CAC certificate', sub: 'Certificate of incorporation for your business' },
      { key: 'docMembershipCert', label: 'Membership certificate', sub: 'Valid cooperative or association membership cert' },
    ];
    this.docFields = allDocs
      .filter((d) => this.product[d.key] !== 'none')
      .map((d) => ({ ...d, required: this.product[d.key] === 'required' }));

    const rec = this.product as unknown as Record<string, string>;
    (this.product.customDocs ?? []).forEach((doc, i) => {
      const key = `custom-${i}`;
      if (rec[key] === 'none') return;
      this.docFields.push({
        key,
        label: doc.name,
        sub: `Accepted formats: ${doc.types.join(', ')}`,
        required: rec[key] === 'required',
      });
    });

    if (p.entryPhone && this.entryPhone) this.phone = this.entryPhone;
    if (p.entryEmail && this.entryEmail) this.email = this.entryEmail;
    if (p.entryBvn && this.entryBvn) this.bvn = this.entryBvn;
    if (p.entryNin && this.entryNin) this.nin = this.entryNin;
  }

  // ── Build step list based on config flags (capped at 6 steps after entry) ──
  private buildSteps() {
    const p = this.product;
    const steps: StepDef[] = [{ id: 'welcome', label: 'Welcome' }];

    if (p.entryPhone || p.entryEmail || p.entryBvn || p.entryNin) {
      steps.push({ id: 'entry', label: 'Identify yourself' });
    }

    steps.push({ id: 'income', label: 'Income & employment' });
    steps.push({ id: 'eligible-amount', label: 'Your loan amount' });
    if (this.pendingIdentityFields.length) steps.push({ id: 'identity', label: 'Verify identity' });
    if (this.docFields.length) steps.push({ id: 'documents', label: 'Documents' });
    if (p.videoConfirmation) steps.push({ id: 'video', label: 'Caltos Verify' });
    steps.push({ id: 'review', label: 'Legal & submit' });

    this.steps = steps;
  }

  /** The lender's own brand color, driving every accent in this portal (CTA, progress, focus rings) — falls back to the original signature purple for products created before branding existed. */
  get brandColor(): string {
    return this.product.brandColor || '#7C5CEB';
  }

  // ── Step helpers ────────────────────────────────────────────────────────────
  get currentStep(): StepDef { return this.steps[this.stepIndex] ?? { id: 'welcome', label: 'Welcome' }; }

  get progress(): number {
    return (this.stepIndex / Math.max(this.steps.length - 1, 1)) * 100;
  }

  get isFirst(): boolean { return this.stepIndex === 0; }
  get isLast(): boolean { return this.stepIndex === this.steps.length - 1; }

  /** Amount can only be edited down from the eligible max, never up. */
  onAmountEdit(raw: string) {
    const digits = raw.replace(/[^\d]/g, '');
    const max = this.eligibilityResult?.maxEligibleAmount ?? this.amountMax;
    this.loanAmount = String(Math.min(+digits || 0, max));
  }

  get minTenorBound(): number {
    return +(this.product.minTenor || 1);
  }

  get maxTenorBound(): number {
    return this.eligibilityResult ? this.eligibilityResult.tenorMonths : +(this.product.maxTenor || 12);
  }

  /** Gates the footer Continue button per-step for state that isn't a simple required-field check. */
  get canContinue(): boolean {
    switch (this.currentStep.id) {
      case 'identity':
        return this.identityQueueIndex >= this.pendingIdentityFields.length;
      case 'eligible-amount':
        return !!this.eligibilityResult && this.eligibilityResult.decision === 'approved';
      case 'video':
        return !!this.videoConfirmationDataUrl;
      case 'review':
        return this.legalConsentAccepted && this.legalCreditCheckAccepted;
      default:
        return true;
    }
  }

  next() {
    if (this.stepIndex < this.steps.length - 1) {
      if (this.currentStep.id === 'video') this.stopCameraTracks();
      this.stepIndex++;
      if (this.currentStep.id === 'video' && !this.videoConfirmationDataUrl) this.startCamera();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  back() {
    if (this.stepIndex > 0) {
      if (this.currentStep.id === 'video') this.stopCameraTracks();
      this.stepIndex--;
      if (this.currentStep.id === 'video' && !this.videoConfirmationDataUrl) this.startCamera();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Set when submit() is blocked by an in-progress duplicate application from this BVN. */
  duplicateBlockMessage: string | null = null;

  get productNotLiveYet(): boolean {
    const record = this.resolvedProductId ? this.productsService.getById(this.resolvedProductId) : undefined;
    return !!record && record.status !== 'live';
  }

  submit() {
    if (this.productNotLiveYet) {
      this.duplicateBlockMessage = 'This loan product isn\'t accepting applications yet — check back soon.';
      return;
    }
    const applicantIdentifier = this.bvn || this.entryBvn;
    const duplicateReason = this.loansService.getDuplicateApplicationBlockReason(this.resolvedProductId, applicantIdentifier);
    if (duplicateReason) {
      this.duplicateBlockMessage = duplicateReason;
      return;
    }

    const customerName = `${this.firstName} ${this.lastName}`.trim() || 'Applicant';
    const phone = this.phone || this.entryPhone;

    const eligibilityInput: EligibilityInput = {
      income: { source: (this.incomeChannel as IncomeSource) || 'other', monthlyAmount: +this.monthlyIncome || 0 },
      stability: this.mapEmploymentStability(),
      repaymentHistory: { isRepeatBorrower: false },
      exposure: { hasActiveLoanElsewhere: false },
    };
    const eligibility = this.eligibilityResult ?? scoreEligibility(eligibilityInput);

    const requiredDocuments = this.docFields.map((d) => ({
      type: d.label,
      uploaded: !!this.getDoc(d.key),
      approved: !!this.verifiedDocs[d.key],
    }));

    const created = this.loansService.create({
      productId: this.resolvedProductId,
      applicantIdentifier,
      customerName,
      customerPhone: phone,
      customerEmail: this.email || this.entryEmail,
      customerPhoto: '',
      amount: +this.loanAmount,
      tenor: +this.loanTenor,
      interestRate: +(this.product.interestRate || 0),
      totalRepayment: this.totalRepayment,
      monthlyRepayment: this.monthlyEst,
      workplace: this.employerName,
      workplaceIdNumber: this.staffId,
      telephoneNumber: phone,
      salaryBankName: this.bankName,
      salaryBankAccount: this.bankAccountNumber,
      referralCode: this.route.snapshot.queryParamMap.get('ref') ?? '',
      status: 'new',
      verificationResults: {
        bvnVerified: /^\d{11}$/.test(this.bvn),
        secondaryCheckPassed: this.identityQueueIndex >= this.pendingIdentityFields.length,
        mismatchFlags: /^\d{11}$/.test(this.bvn) || !this.product.identityBvn ? [] : ['BVN could not be validated — expected an 11-digit number.'],
      },
      eligibilityScore: {
        score: eligibility.score,
        maxEligibleAmount: eligibility.maxEligibleAmount,
        tenor: eligibility.tenorMonths,
        breakdown: eligibility.breakdown,
      },
      requiredDocuments,
      deductionChannelStatus: this.loansService.buildDeductionChannelStatus(this.resolvedProductId),
      videoConfirmationDataUrl: this.videoConfirmationDataUrl ?? undefined,
      utmSource: this.route.snapshot.queryParamMap.get('utm_source') ?? 'direct',
      utmMedium: this.route.snapshot.queryParamMap.get('utm_medium') ?? 'organic',
    });

    this.refNumber = created.loanUniqueId;

    if (this.product.autoDisburseEnabled) {
      // Deductions/mandates are mocked, same convention as everywhere else in this demo app —
      // the loan is flipped straight to 'disbursed' once the journey modal finishes.
      this.loansService.setStatus(created.id, 'disbursed');
      this.runDisburseJourney();
    } else {
      this.submitted = true;
    }
  }

  // ── Auto-disburse "money on its way" journey modal ──────────────────────────
  readonly disburseJourneyPhases = [
    'Submitting application',
    'Reviewing application',
    'Setting up deductions and mandates',
    'Cleaning up',
    'Your money is on its way — you\'ll get it in 5 mins max',
  ];
  disburseJourneyVisible = false;
  disburseJourneyPhaseIndex = 0;

  private runDisburseJourney() {
    this.disburseJourneyVisible = true;
    this.disburseJourneyPhaseIndex = 0;
    this.cdr.markForCheck();
    const advance = () => {
      if (this.disburseJourneyPhaseIndex < this.disburseJourneyPhases.length - 1) {
        this.disburseJourneyPhaseIndex++;
        this.cdr.markForCheck();
        setTimeout(advance, 900);
      } else {
        setTimeout(() => {
          this.disburseJourneyVisible = false;
          this.submitted = true;
          this.cdr.markForCheck();
        }, 1200);
      }
    };
    setTimeout(advance, 900);
  }

  // ── OTP (legacy single-field trigger, kept for the entry-step "recognise existing" flow) ──
  sendOtp() { this.otpSent = true; }

  // ── Documents ───────────────────────────────────────────────────────────────
  onFileChange(event: Event, key: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadedDocs = { ...this.uploadedDocs, [key]: { file, name: file.name } };
    this.verifyingDocs = { ...this.verifyingDocs, [key]: true };
    setTimeout(() => {
      this.verifyingDocs = { ...this.verifyingDocs, [key]: false };
      this.verifiedDocs = { ...this.verifiedDocs, [key]: true };
      this.cdr.markForCheck();
    }, 1100);
  }

  removeDoc(key: string) {
    this.uploadedDocs = { ...this.uploadedDocs, [key]: null };
    const { [key]: _removed, ...restVerified } = this.verifiedDocs;
    this.verifiedDocs = restVerified;
  }

  getDoc(key: string) { return this.uploadedDocs[key] ?? null; }

  get allDocsVerified(): boolean {
    return this.docFields.filter((d) => d.required).every((d) => this.verifiedDocs[d.key]);
  }

  // ── Video confirmation ("Caltos Verify") ─────────────────────────────────────
  @ViewChild('videoPreview') videoPreviewRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('videoPlayback') videoPlaybackRef?: ElementRef<HTMLVideoElement>;

  cameraStream: MediaStream | null = null;
  cameraError: string | null = null;
  isRecording = false;
  recordedChunks: Blob[] = [];
  mediaRecorder: MediaRecorder | null = null;
  videoPlaybackUrl: string | null = null;
  videoConfirmationDataUrl: string | null = null;
  checkingVideo = false;

  async startCamera() {
    this.cameraError = null;
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (this.videoPreviewRef) {
        this.videoPreviewRef.nativeElement.srcObject = this.cameraStream;
      }
    } catch {
      this.cameraError = 'Camera and microphone access is needed to record your confirmation. Please allow access and try again.';
    }
  }

  startRecording() {
    if (!this.cameraStream) return;
    this.recordedChunks = [];
    const recorder = new MediaRecorder(this.cameraStream);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
    recorder.onstop = () => this.onRecordingStopped();
    recorder.start();
    this.mediaRecorder = recorder;
    this.isRecording = true;
  }

  stopRecording() {
    this.mediaRecorder?.stop();
    this.isRecording = false;
    this.checkingVideo = true;
  }

  private onRecordingStopped() {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    if (this.videoPlaybackUrl) URL.revokeObjectURL(this.videoPlaybackUrl);
    this.videoPlaybackUrl = URL.createObjectURL(blob);
    this.stopCameraTracks();

    const reader = new FileReader();
    reader.onload = () => {
      this.videoConfirmationDataUrl = reader.result as string;
      this.checkingVideo = false;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(blob);
  }

  retakeVideo() {
    if (this.videoPlaybackUrl) URL.revokeObjectURL(this.videoPlaybackUrl);
    this.videoPlaybackUrl = null;
    this.videoConfirmationDataUrl = null;
    this.checkingVideo = false;
    this.recordedChunks = [];
    this.startCamera();
  }

  private stopCameraTracks() {
    this.cameraStream?.getTracks().forEach((t) => t.stop());
    this.cameraStream = null;
  }

  ngOnDestroy() {
    this.stopCameraTracks();
    if (this.videoPlaybackUrl) URL.revokeObjectURL(this.videoPlaybackUrl);
  }

  // ── Loan summary ────────────────────────────────────────────────────────────
  get monthlyEst(): number {
    return Math.ceil((+this.loanAmount * (1 + +(this.product.interestRate || 2.5) / 100)) / (+this.loanTenor || 1));
  }

  get totalRepayment(): number {
    return Math.ceil(+this.loanAmount * (1 + +(this.product.interestRate || 2.5) / 100));
  }

  get interestRateDisplay(): string {
    return `${this.product.interestRate || '2.5'}% / ${this.product.tenorUnit?.slice(0, -1).toLowerCase() || 'month'} (${this.product.interestModel || 'Flat Rate'})`;
  }
}
