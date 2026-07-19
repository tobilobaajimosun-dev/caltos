import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BankSelectComponent, SelectComponent, VideoCaptureFieldComponent } from '../../../shared/components';
import { SelectOption } from '../../../shared/components/select/select.component';
import { ApplicantProfile, AUDIENCE_INCOME_METHODS, IncomeVerificationSource, DEDUCTION_CHANNEL_DEFS } from '../../../shared/services/products.service';
import { LoansService } from '../../../shared/services/loans.service';
import { CustomersService } from '../../../shared/services/customers.service';
import { LoanConfig } from '../../loans/create-loan/create-loan.component';
import { formatThousands, parseThousands } from '../../../shared/utils/number-format';
import {
  EligibilityConfig, EligibilityInput, EligibilityResult, IncomeSource,
  DEFAULT_ELIGIBILITY_CONFIG, scoreEligibility, estimateMonthlyRepayment,
} from '../../../shared/utils/eligibility-scoring';
import { FIELD_DEFS } from '../apply-profile-flow/field-defs';
import { MANDATE_RAIL_COPY, DEFAULT_MANDATE_COPY } from '../apply-profile-flow/mandate-copy';
import { synthesizeDefaultProfile } from '../apply-profile-flow/default-profile';

/** BNPL-specific audience categories — wider than the standard AudienceCategory,
 * includes paramilitary and an "others" catch-all that results in a not-served screen. */
type BnplAudience = 'public-servant' | 'sme-owner' | 'private-worker' | 'paramilitary' | 'others';

type V2BucketId =
  | 'about' | 'entry' | 'profile' | 'personal'
  | 'income-verification' | 'eligibility' | 'type-details'
  | 'documents' | 'offer' | 'mandate' | 'caltos-verify' | 'review' | 'disbursement'
  | 'bnpl-vendor' | 'bnpl-invoice' | 'bnpl-profile' | 'bnpl-not-served';

interface DraftSnapshotV2 {
  savedBucketIndex: number;
  selectedProfileId: string;
  entryPhone: string;
  entryEmail: string;
  isReturningCustomer: boolean;
  bvn: string;
  bvnVerified: boolean;
  selectedIncomeMethod: IncomeVerificationSource | null;
  values: Record<string, string>;
  bankName: string;
  accountNumber: string;
  accountFetched: boolean;
  accountName: string;
  fetchedMonthlyIncome: number;
  loanAmount: string;
  loanTenor: string;
  mandateBankName: string;
  mandateAccountNumber: string;
  mandateConsent: boolean;
  bnplVendor: string;
  bnplInvoiceAmount: string;
  bnplInvoiceFileName: string;
  bnplAudience: BnplAudience | null;
}

const INCOME_METHOD_LABELS: Record<IncomeVerificationSource, string> = {
  remita: 'Remita',
  wacs: 'IPPIS / WACS',
  payslip: 'Upload payslip',
  'bank-statement': 'Upload bank statement',
  'business-revenue': 'Declare business revenue',
};

const INCOME_METHOD_SHORT_LABELS: Record<IncomeVerificationSource, string> = {
  remita: 'Remita',
  wacs: 'IPPIS/WACS',
  payslip: 'Payslip',
  'bank-statement': 'Bank statement',
  'business-revenue': 'Business revenue',
};

@Component({
  selector: 'app-apply-flow-v2',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DecimalPipe, BankSelectComponent, SelectComponent, VideoCaptureFieldComponent],
  templateUrl: './apply-flow-v2.component.html',
  styleUrls: ['../apply-profile-flow/apply-profile-flow.component.scss', './apply-flow-v2.component.scss'],
})
export class ApplyFlowV2Component implements OnInit, OnDestroy {
  product = input.required<LoanConfig>();
  productId = input.required<string>();
  orgLogoDataUrl = input<string | null>(null);
  orgName = input<string>('');

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly loansService = inject(LoansService);
  private readonly customersService = inject(CustomersService);

  readonly fieldDefs = FIELD_DEFS;
  readonly incomeMethodLabels = INCOME_METHOD_LABELS;

  // ── Bucket state machine ─────────────────────────────────────────────────────
  bucketIndex = 0;
  /** Saved step index for "resume" — restored from draft but not applied immediately. */
  savedBucketIndex = 0;

  get isBnpl(): boolean { return this.product().template === 'bnpl'; }

  /** BVN identity check is optional per product config. */
  get requiresBvn(): boolean { return !!this.product().identityBvn; }

  get profiles(): ApplicantProfile[] {
    const configured = this.product().applicantProfiles ?? [];
    return configured.length ? configured : [synthesizeDefaultProfile(this.product())];
  }

  get bucketOrder(): V2BucketId[] {
    const isBnpl = this.isBnpl;
    const buckets: V2BucketId[] = ['about', 'entry'];

    if (isBnpl) {
      buckets.push('bnpl-vendor', 'bnpl-invoice');
    }

    // Only show profile selector when more than one audience type can apply.
    if (!isBnpl && this.profiles.length > 1) buckets.push('profile');
    if (!this.isReturningCustomer) buckets.push('personal');

    if (isBnpl) {
      buckets.push('bnpl-profile');
      if (this.bnplAudience === 'others') {
        buckets.push('bnpl-not-served');
        return buckets;
      }
      if (this.bnplAudience !== 'paramilitary') {
        buckets.push('income-verification');
      }
    } else {
      buckets.push('income-verification');
    }

    buckets.push('eligibility', 'offer', 'type-details', 'documents', 'mandate');
    if (this.product().videoConfirmation) buckets.push('caltos-verify');
    buckets.push('review', 'disbursement');
    return buckets;
  }

  get currentBucket(): V2BucketId {
    return this.bucketOrder[this.bucketIndex] ?? 'about';
  }

  get progress(): number {
    return (this.bucketIndex / Math.max(this.bucketOrder.length - 1, 1)) * 100;
  }

  private readonly hiddenFromStepCount: V2BucketId[] = ['about', 'eligibility', 'disbursement', 'bnpl-not-served'];

  get visibleStepIndex(): number {
    const visible = this.bucketOrder.filter(b => !this.hiddenFromStepCount.includes(b));
    return visible.indexOf(this.currentBucket) + 1;
  }

  get visibleStepTotal(): number {
    return this.bucketOrder.filter(b => !this.hiddenFromStepCount.includes(b)).length;
  }

  get showHeader(): boolean {
    return this.currentBucket !== 'about';
  }

  get orgInitials(): string {
    const name = this.product().brandName || this.orgName();
    return name.split(' ').slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase() || 'LN';
  }

  get borrowerName(): string {
    return this.values['fullName'] || this.accountName || 'Applicant';
  }

  get offerDate(): string {
    const d = new Date();
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /** Whether there is a saved draft the user can resume. */
  get hasDraft(): boolean {
    return this.savedBucketIndex > 0;
  }

  resumeApplication() {
    this.bucketIndex = this.savedBucketIndex;
    this.cdr.markForCheck();
  }

  next() {
    if (this.currentBucket === 'entry' && !this.returningCustomerChecked) {
      this.checkReturningCustomer();
    }
    if (this.bucketIndex < this.bucketOrder.length - 1) {
      this.bucketIndex++;
      this.saveDraft();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Auto-trigger eligibility calculation when entering that bucket.
      if (this.currentBucket === 'eligibility' && !this.eligibilityResult && !this.isCalculatingEligibility) {
        this.calculateEligibility();
      }
    }
  }

  back() {
    if (this.bucketIndex > 0) {
      this.bucketIndex--;
      this.saveDraft();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  jumpTo(bucket: V2BucketId) {
    const idx = this.bucketOrder.indexOf(bucket);
    if (idx >= 0) this.bucketIndex = idx;
  }

  // ── About ─────────────────────────────────────────────────────────────────────
  get audienceLabels(): string[] {
    return this.profiles.map((p) => p.label).filter(Boolean);
  }

  get eligibilitySummary(): string {
    const parts: string[] = [];
    const minAge = this.product().minAge;
    const maxAge = this.product().maxAge;
    if (minAge || maxAge) {
      parts.push(maxAge ? `Ages ${minAge || '18'}–${maxAge}` : `Ages ${minAge}+`);
    }
    parts.push(...this.audienceLabels);
    return parts.join(' · ');
  }

  get incomeVerificationSummary(): string {
    const methods = new Set<IncomeVerificationSource>();
    for (const profile of this.profiles) {
      const allowed = profile.audience ? AUDIENCE_INCOME_METHODS[profile.audience] : [profile.incomeVerificationSource];
      allowed.forEach((m) => m !== 'business-revenue' && methods.add(m));
    }
    return Array.from(methods).map((m) => INCOME_METHOD_SHORT_LABELS[m]).join(' or ');
  }

  // ── Entry + returning-customer detection ──────────────────────────────────────
  entryPhone = '';
  entryEmail = '';
  isReturningCustomer = false;
  returningCustomerChecked = false;

  get entryCanContinueBase(): boolean {
    return !!this.entryPhone || !!this.entryEmail;
  }

  private checkReturningCustomer() {
    const match = this.customersService.findByPhone(this.entryPhone);
    this.isReturningCustomer = !!match;
    this.returningCustomerChecked = true;
    if (match) {
      this.entryEmail = this.entryEmail || match.email;
      this.values['fullName'] = this.values['fullName'] || match.name;
      this.values['addressStreet'] = this.values['addressStreet'] || match.address;
      this.accountName = this.accountName || match.name;
    }
  }

  // ── Applicant profile selector ────────────────────────────────────────────────
  selectedProfileId = '';

  get selectedProfile(): ApplicantProfile | undefined {
    return this.profiles.find((p) => p.profileId === this.selectedProfileId) ?? this.profiles[0];
  }

  selectProfile(id: string) {
    this.selectedProfileId = id;
    // Single-profile products: auto-advance, no manual confirmation needed.
    if (this.profiles.length === 1) {
      this.next();
    }
  }

  // ── Personal + Address + BVN (new customers only) ─────────────────────────────
  values: Record<string, string> = {};
  touched = new Set<string>();

  get personalFields() {
    return (this.selectedProfile?.fieldsRequired ?? []).filter((k) => this.fieldDefs[k].screenCategory === 'personal');
  }

  get addressFields() {
    return (this.selectedProfile?.fieldsRequired ?? []).filter((k) => this.fieldDefs[k].screenCategory === 'address');
  }

  get typeDetailFields() {
    return (this.selectedProfile?.fieldsRequired ?? []).filter(
      (k) => (this.fieldDefs[k].screenCategory === 'work' || this.fieldDefs[k].screenCategory === 'business') && k !== 'monthlyIncome',
    );
  }

  onFieldInput(key: string, raw: string) {
    const def = this.fieldDefs[key as keyof typeof this.fieldDefs];
    this.values[key] = def?.inputType === 'money' ? formatThousands(raw) : raw;
  }

  onFieldBlur(key: string) {
    this.touched.add(key);
  }

  fieldError(key: string): string | null {
    if (!this.touched.has(key)) return null;
    return this.values[key] ? null : 'This field is required.';
  }

  private readonly VALIDATORS: Record<string, (v: string) => string | null> = {
    bvn: (v) => (/^\d{11}$/.test(v) ? null : 'Enter a valid 11-digit BVN.'),
    entryPhone: (v) => (v && !/^\d{10,11}$/.test(v.replace(/\D/g, '')) ? 'Enter a valid phone number.' : null),
    accountNumber: (v) => (/^\d{10}$/.test(v) ? null : 'Enter a valid 10-digit account number.'),
    mandateAccountNumber: (v) => (/^\d{10}$/.test(v) ? null : 'Enter a valid 10-digit account number.'),
  };

  onSimpleFieldBlur(key: string) {
    this.touched.add(key);
  }

  simpleFieldError(key: string, value: string): string | null {
    if (!this.touched.has(key)) return null;
    return this.VALIDATORS[key]?.(value) ?? null;
  }

  get personalCanContinue(): boolean {
    const fieldsFilled = [...this.personalFields, ...this.addressFields].every((k) => !!this.values[k]);
    return fieldsFilled && (!this.requiresBvn || this.bvnVerified);
  }

  get typeDetailsCanContinue(): boolean {
    return this.typeDetailFields.every((k) => !!this.values[k]);
  }

  // ── BVN identity verification (in personal bucket, only if product requires it) ─
  bvn = '';
  bvnOtpOpen = false;
  bvnOtpCode = '';
  bvnVerified = false;
  exposureMatches: { productName: string; loanUniqueId: string; status: string }[] = [];

  sendBvnOtp() {
    if (!/^\d{11}$/.test(this.bvn)) return;
    this.bvnOtpOpen = true;
    this.bvnOtpCode = '';
  }

  verifyBvnOtp() {
    if (this.bvnOtpCode !== '123456') return;
    this.bvnVerified = true;
    this.bvnOtpOpen = false;
    this.exposureMatches = this.loansService.getCrossProductExposure(this.bvn);
    this.saveDraft();
    this.cdr.markForCheck();
  }

  closeBvnOtp() {
    this.bvnOtpOpen = false;
  }

  // ── BNPL-specific state ───────────────────────────────────────────────────────
  bnplVendor = '';
  bnplInvoiceAmount = '';
  bnplInvoiceFileName = '';
  bnplAudience: BnplAudience | null = null;

  get bnplVendorCanContinue(): boolean { return !!this.bnplVendor; }
  get bnplInvoiceCanContinue(): boolean { return !!this.bnplInvoiceAmount; }
  get bnplProfileCanContinue(): boolean { return !!this.bnplAudience; }
  get bnplInvoiceAmountNum(): number { return parseThousands(this.bnplInvoiceAmount) || 0; }
  get bnplInvoiceAmountDisplay(): string { return this.bnplInvoiceAmount ? formatThousands(this.bnplInvoiceAmount) : ''; }

  get bnplIsEligibleForFullInvoice(): boolean {
    if (!this.eligibilityResult || !this.bnplInvoiceAmountNum) return false;
    return this.eligibilityResult.maxEligibleAmount >= this.bnplInvoiceAmountNum;
  }

  // Onboarded vendors only — vendor categories are not selectable options.
  get bnplVendorOptions(): SelectOption[] {
    return (this.product().vendors ?? [])
      .map(v => ({ value: v.businessName, label: `${v.businessName} · ${v.category}` }));
  }

  onBnplInvoiceAmountInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = parseThousands(raw);
    this.bnplInvoiceAmount = parsed > 0 ? String(parsed) : '';
    (event.target as HTMLInputElement).value = this.bnplInvoiceAmountDisplay;
    this.cdr.markForCheck();
  }

  selectBnplAudience(audience: BnplAudience) {
    if (this.bnplAudience !== audience) {
      this.bnplAudience = audience;
      this.selectedIncomeMethod = null;
    }
  }

  onBnplInvoiceFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.bnplInvoiceFileName = file.name;
    this.saveDraft();
  }

  /** True when one profile type can apply but that profile has multiple income methods to choose from. */
  get singleProfileMultipleMethods(): boolean {
    return !this.isBnpl && this.profiles.length === 1 && this.allowedIncomeMethods.length > 1;
  }

  /** Dynamic headline for the income-verification bucket. */
  get incomeVerificationHeadline(): string {
    if (this.allowedIncomeMethods.length > 1 && !this.selectedIncomeMethod) {
      return 'How do you get paid?';
    }
    const method = this.effectiveIncomeMethod;
    if (method === 'bank-statement' || method === 'payslip') {
      return 'Verify your eligibility';
    }
    return 'Verify your income';
  }

  /** Whether the product has an age restriction requiring DOB capture on the entry screen. */
  get hasAgeRestriction(): boolean {
    return !!(this.product().minAge || this.product().maxAge);
  }

  dob = '';

  get dobAgeYears(): number {
    if (!this.dob) return 0;
    const birth = new Date(this.dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  get dobAgeError(): string | null {
    if (!this.dob) return null;
    const age = this.dobAgeYears;
    const min = +(this.product().minAge || 18);
    const max = +(this.product().maxAge || 0);
    if (age < min) return `You must be at least ${min} years old to apply.`;
    if (max && age > max) return `This product is only available for applicants up to ${max} years old.`;
    return null;
  }

  get entryCanContinue(): boolean {
    const contactOk = !!this.entryPhone || !!this.entryEmail;
    if (this.hasAgeRestriction) {
      return contactOk && !!this.dob && !this.dobAgeError;
    }
    return contactOk;
  }

  // ── Income verification (Remita / WACS / bank-statement / payslip only) ───────
  selectedIncomeMethod: IncomeVerificationSource | null = null;

  get allowedIncomeMethods(): IncomeVerificationSource[] {
    if (this.isBnpl) {
      switch (this.bnplAudience) {
        case 'public-servant': return ['remita', 'wacs'];
        case 'sme-owner': return ['bank-statement'];
        case 'private-worker': return ['payslip', 'bank-statement'];
        case 'paramilitary': return [];
        default: return [];
      }
    }
    const audience = this.selectedProfile?.audience;
    const methods = audience
      ? AUDIENCE_INCOME_METHODS[audience]
      : (this.selectedProfile ? [this.selectedProfile.incomeVerificationSource] : []);
    return methods.filter((m) => m !== 'business-revenue');
  }

  get effectiveIncomeMethod(): IncomeVerificationSource | null {
    if (this.isBnpl && this.bnplAudience === 'private-worker') return null;
    if (this.selectedIncomeMethod) return this.selectedIncomeMethod;
    return this.allowedIncomeMethods.length === 1 ? this.allowedIncomeMethods[0] : null;
  }

  selectIncomeMethod(method: IncomeVerificationSource) {
    this.selectedIncomeMethod = method;
  }

  bankName = '';
  accountNumber = '';
  fetchingAccount = false;
  accountFetched = false;
  accountName = '';
  fetchedMonthlyIncome = 0;

  fetchAccountDetails() {
    if (!this.bankName || !this.accountNumber) return;
    this.fetchingAccount = true;
    setTimeout(() => {
      this.fetchingAccount = false;
      this.accountFetched = true;
      this.accountName = this.accountName || 'Aisha Bello';
      this.fetchedMonthlyIncome = 220_000;
      if (!this.values['employerName']) this.values['employerName'] = 'Federal Ministry of Finance';
      if (!this.values['jobTitle']) this.values['jobTitle'] = 'Officer';
      this.saveDraft();
      this.cdr.markForCheck();
    }, 1200);
  }

  onIncomeDocFileChange(key: string, event: Event) {
    this.onDocFileChange(key, event);
    if (this.isDocComplete(key)) {
      this.fetchedMonthlyIncome = this.fetchedMonthlyIncome || 150_000;
      this.saveDraft();
    }
  }

  get showMonthlyIncomeField(): boolean {
    if (this.isBnpl && this.bnplAudience === 'private-worker') return true;
    const method = this.effectiveIncomeMethod;
    return this.selectedProfile?.audience === 'private-sector-worker' &&
      (method === 'payslip' || method === 'bank-statement');
  }

  get incomeVerificationCanContinue(): boolean {
    if (this.isBnpl && this.bnplAudience === 'private-worker') {
      return !!this.docs['payslip-upload']?.fileName &&
             !!this.docs['bank-statement-upload']?.fileName &&
             !!this.values['monthlyIncome'];
    }
    const method = this.effectiveIncomeMethod;
    if (!method) return false;
    if (method === 'remita' || method === 'wacs') return this.accountFetched;
    if (method === 'bank-statement') {
      return !!this.docs['bank-statement-upload']?.fileName &&
        (!this.showMonthlyIncomeField || !!this.values['monthlyIncome']);
    }
    if (method === 'payslip') {
      return !!this.docs['payslip-upload']?.fileName &&
        (!this.showMonthlyIncomeField || !!this.values['monthlyIncome']);
    }
    return false;
  }

  // ── Documents ─────────────────────────────────────────────────────────────────
  docs: Record<string, { file?: File; fileName?: string; videoDataUrl?: string }> = {};

  onDocFileChange(key: string, event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.docs[key] = { file, fileName: file.name };
    this.saveDraft();
  }

  onDocVideoChange(key: string, dataUrl: string | null) {
    this.docs[key] = dataUrl ? { videoDataUrl: dataUrl } : {};
    this.saveDraft();
  }

  isDocComplete(key: string): boolean {
    const d = this.docs[key];
    return !!(d?.fileName || d?.videoDataUrl);
  }

  get completedDocsCount(): number {
    return (this.selectedProfile?.requiredDocuments ?? []).filter((d) => this.isDocComplete(d.key)).length;
  }

  get documentsCanContinue(): boolean {
    return this.completedDocsCount === (this.selectedProfile?.requiredDocuments ?? []).length;
  }

  // ── Eligibility — auto-triggered, result shown with explicit CTA to continue ──
  isCalculatingEligibility = false;
  eligibilityResult: EligibilityResult | null = null;
  loanAmount = '';
  loanTenor = '';
  desiredAmountOverLimit = false;

  get eligibilityApproved(): boolean {
    return this.eligibilityResult?.decision === 'approved';
  }

  private buildEligibilityInput(): EligibilityInput {
    const method = this.effectiveIncomeMethod;
    const incomeSourceMap: Record<string, IncomeSource> = {
      wacs: 'wacs', remita: 'remita', payslip: 'other', 'bank-statement': 'other',
    };
    const monthlyAmount = (this.selectedProfile?.audience === 'private-sector-worker' || (this.isBnpl && this.bnplAudience === 'private-worker'))
      ? parseThousands(this.values['monthlyIncome'] || '0') || this.fetchedMonthlyIncome
      : this.fetchedMonthlyIncome;
    return {
      income: { source: incomeSourceMap[method ?? 'other'] ?? 'other', monthlyAmount },
      stability: (this.selectedProfile?.audience === 'sme-owner' || (this.isBnpl && this.bnplAudience === 'sme-owner'))
        ? { type: 'mda', category: 'sme' }
        : { type: 'mda', category: 'private-large' },
      repaymentHistory: { isRepeatBorrower: this.isReturningCustomer },
      exposure: { hasActiveLoanElsewhere: this.exposureMatches.length > 0 },
    };
  }

  calculateEligibility() {
    this.isCalculatingEligibility = true;
    const config: EligibilityConfig = {
      ...DEFAULT_ELIGIBILITY_CONFIG,
      productMaxAmount: +(this.product().maxAmount || 0),
      productMaxTenorMonths: +(this.product().maxTenor || 12),
      productMinTenorMonths: +(this.product().minTenor || 1),
    };
    setTimeout(() => {
      const result = scoreEligibility(this.buildEligibilityInput(), config);
      this.eligibilityResult = result;
      this.isCalculatingEligibility = false;
      if (result.decision === 'approved') {
        const invoiceAmt = this.isBnpl ? this.bnplInvoiceAmountNum : 0;
        this.loanAmount = this.isBnpl && invoiceAmt > 0
          ? String(Math.min(result.maxEligibleAmount, invoiceAmt))
          : String(result.maxEligibleAmount);
        this.loanTenor = String(result.tenorMonths);
      }
      this.saveDraft();
      this.cdr.markForCheck();
    }, 1500);
  }

  onLoanAmountInput(raw: string, inputEl: HTMLInputElement) {
    const max = this.eligibilityResult?.maxEligibleAmount ?? 0;
    const parsed = parseThousands(raw);
    this.desiredAmountOverLimit = parsed > max;
    this.loanAmount = String(Math.min(parsed, max));
    inputEl.value = this.loanAmountDisplay;
    if (this.desiredAmountOverLimit) {
      setTimeout(() => { this.desiredAmountOverLimit = false; this.cdr.markForCheck(); }, 3500);
    }
    this.cdr.markForCheck();
  }

  get loanAmountDisplay(): string {
    return this.loanAmount ? formatThousands(this.loanAmount) : '';
  }

  get monthlyEst(): number {
    return estimateMonthlyRepayment(
      +this.loanAmount || 0,
      +this.loanTenor || 1,
      +(this.product().interestRate || 0),
      (this.product().interestModel as 'Flat Rate' | 'Reducing Balance' | 'Percentage Based') || 'Flat Rate',
    );
  }

  get totalInterest(): number {
    return (this.monthlyEst * (+this.loanTenor || 1)) - (+this.loanAmount || 0);
  }

  // ── Offer ──────────────────────────────────────────────────────────────────────
  offerDeclined = false;
  offerExited = false;

  get processingFeeAmount(): number {
    const type = this.product().processingFeeType;
    const rate = +(this.product().processingFeeRate || 0);
    if (!rate) return 0;
    return type === 'Percentage' ? Math.round((+this.loanAmount || 0) * rate / 100) : Math.round(rate);
  }

  get totalRepaymentAmount(): number {
    return this.monthlyEst * (+this.loanTenor || 1) + this.processingFeeAmount;
  }

  acceptOffer() {
    this.next();
  }

  rejectOffer() {
    if (!this.selectedProfile) return;
    this.loansService.create({
      productId: this.productId(),
      applicantIdentifier: this.bvn,
      customerName: this.borrowerName,
      customerPhone: this.entryPhone,
      customerEmail: this.entryEmail,
      customerPhoto: '',
      amount: +this.loanAmount,
      tenor: +this.loanTenor,
      interestRate: +(this.product().interestRate || 0),
      totalRepayment: this.totalRepaymentAmount,
      monthlyRepayment: this.monthlyEst,
      workplace: this.values['employerName'] || this.values['businessName'] || '',
      workplaceIdNumber: this.values['staffId'] || '',
      telephoneNumber: this.entryPhone,
      salaryBankName: '',
      salaryBankAccount: '',
      referralCode: this.route.snapshot.queryParamMap.get('ref') ?? '',
      status: 'declined',
      verificationResults: { bvnVerified: this.bvnVerified, secondaryCheckPassed: this.bvnVerified, mismatchFlags: [] },
      eligibilityScore: {
        score: this.eligibilityResult?.score ?? 0,
        maxEligibleAmount: this.eligibilityResult?.maxEligibleAmount ?? 0,
        tenor: this.eligibilityResult?.tenorMonths ?? 0,
        breakdown: this.eligibilityResult?.breakdown,
      },
      requiredDocuments: (this.selectedProfile.requiredDocuments ?? []).map((d) => ({
        type: d.label, uploaded: this.isDocComplete(d.key), approved: this.isDocComplete(d.key),
      })),
      deductionChannelStatus: this.loansService.buildDeductionChannelStatus(this.productId()),
      utmSource: this.route.snapshot.queryParamMap.get('utm_source') ?? 'direct',
      utmMedium: this.route.snapshot.queryParamMap.get('utm_medium') ?? 'organic',
      activityLog: [{ timestamp: new Date().toISOString(), event: 'Borrower rejected the loan offer', actor: 'System' }],
    });
    this.offerDeclined = true;
    this.cdr.markForCheck();
  }

  adjustLoanAmount() {
    this.offerDeclined = false;
    this.jumpTo('offer');
  }

  exitApplication() {
    this.offerExited = true;
  }

  // ── Mandate setup ──────────────────────────────────────────────────────────────
  mandateBankName = '';
  mandateAccountNumber = '';
  mandateConsent = false;

  get mandateCopy() {
    const rail = this.selectedProfile?.mandateRail ?? '';
    return MANDATE_RAIL_COPY[rail] ?? DEFAULT_MANDATE_COPY;
  }

  get mandateCanContinue(): boolean {
    return !!this.mandateBankName && !!this.mandateAccountNumber && this.mandateConsent;
  }

  // ── Caltos Verify (only if product.videoConfirmation is true) ─────────────────
  caltosVerifyVideo: string | null = null;

  onCaltosVerifyVideoChange(dataUrl: string | null) {
    this.caltosVerifyVideo = dataUrl;
    this.saveDraft();
  }

  get caltosVerifyCanContinue(): boolean {
    return !!this.caltosVerifyVideo;
  }

  // ── Review & submit ────────────────────────────────────────────────────────────
  submitted = false;
  refNumber = '';
  finalConsent = false;

  railName(id: string): string {
    return DEDUCTION_CHANNEL_DEFS[id]?.name ?? id;
  }

  submit() {
    if (!this.selectedProfile) return;
    const created = this.loansService.create({
      productId: this.productId(),
      applicantIdentifier: this.bvn,
      customerName: this.borrowerName,
      customerPhone: this.entryPhone,
      customerEmail: this.entryEmail,
      customerPhoto: '',
      amount: +this.loanAmount,
      tenor: +this.loanTenor,
      interestRate: +(this.product().interestRate || 0),
      totalRepayment: this.totalRepaymentAmount,
      monthlyRepayment: this.monthlyEst,
      workplace: this.values['employerName'] || this.values['businessName'] || '',
      workplaceIdNumber: this.values['staffId'] || '',
      telephoneNumber: this.entryPhone,
      salaryBankName: this.mandateBankName,
      salaryBankAccount: this.mandateAccountNumber,
      referralCode: this.route.snapshot.queryParamMap.get('ref') ?? '',
      status: 'new',
      verificationResults: { bvnVerified: this.bvnVerified, secondaryCheckPassed: this.bvnVerified, mismatchFlags: [] },
      eligibilityScore: {
        score: this.eligibilityResult?.score ?? 0,
        maxEligibleAmount: this.eligibilityResult?.maxEligibleAmount ?? (+this.loanAmount || 0),
        tenor: this.eligibilityResult?.tenorMonths ?? (+this.loanTenor || 0),
        breakdown: this.eligibilityResult?.breakdown,
      },
      requiredDocuments: (this.selectedProfile.requiredDocuments ?? []).map((d) => ({
        type: d.label, uploaded: this.isDocComplete(d.key), approved: this.isDocComplete(d.key),
      })),
      deductionChannelStatus: this.loansService.buildDeductionChannelStatus(this.productId()),
      videoConfirmationDataUrl: this.caltosVerifyVideo ?? undefined,
      utmSource: this.route.snapshot.queryParamMap.get('utm_source') ?? 'direct',
      utmMedium: this.route.snapshot.queryParamMap.get('utm_medium') ?? 'organic',
    });
    this.refNumber = created.loanUniqueId;
    this.upsertCustomerRecord();
    this.next();
    this.clearDraft();
    this.triggerConfetti();
  }

  private upsertCustomerRecord() {
    const name = this.borrowerName;
    const existing = this.customersService.findByPhone(this.entryPhone);
    if (existing) {
      this.customersService.update(existing.id, {
        name, email: this.entryEmail || existing.email,
        address: this.values['addressStreet'] || existing.address,
      });
    } else {
      this.customersService.create({
        name, phone: this.entryPhone, email: this.entryEmail,
        bvn: this.bvn, bvnStatus: this.bvnVerified ? 'verified' : 'pending',
        address: [this.values['addressStreet'], this.values['addressCity'], this.values['addressState']].filter(Boolean).join(', '),
        product: this.product().name,
      });
    }
  }

  // ── Confetti ───────────────────────────────────────────────────────────────────
  confettiPieces: { left: number; delay: number; duration: number; color: string; rotate: number }[] = [];

  private triggerConfetti() {
    if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#6941C6', '#12B76A', '#F79009', '#0BA5EC', '#F04438'];
    this.confettiPieces = Array.from({ length: 80 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.5 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: Math.random() * 360,
    }));
    this.cdr.markForCheck();
    setTimeout(() => {
      this.confettiPieces = [];
      this.cdr.markForCheck();
    }, 4500);
  }

  // ── Autosave ───────────────────────────────────────────────────────────────────
  private get draftKey(): string {
    return `caltos_apply_v2_draft_${this.productId()}`;
  }

  private saveDraft() {
    const snapshot: DraftSnapshotV2 = {
      savedBucketIndex: this.bucketIndex,
      selectedProfileId: this.selectedProfileId,
      entryPhone: this.entryPhone,
      entryEmail: this.entryEmail,
      isReturningCustomer: this.isReturningCustomer,
      bvn: this.bvn,
      bvnVerified: this.bvnVerified,
      selectedIncomeMethod: this.selectedIncomeMethod,
      values: this.values,
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      accountFetched: this.accountFetched,
      accountName: this.accountName,
      fetchedMonthlyIncome: this.fetchedMonthlyIncome,
      loanAmount: this.loanAmount,
      loanTenor: this.loanTenor,
      mandateBankName: this.mandateBankName,
      mandateAccountNumber: this.mandateAccountNumber,
      mandateConsent: this.mandateConsent,
      bnplVendor: this.bnplVendor,
      bnplInvoiceAmount: this.bnplInvoiceAmount,
      bnplInvoiceFileName: this.bnplInvoiceFileName,
      bnplAudience: this.bnplAudience,
    };
    try {
      localStorage.setItem(this.draftKey, JSON.stringify(snapshot));
    } catch { /* best-effort only */ }
  }

  private restoreDraft() {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (!raw) return;
      const snapshot = JSON.parse(raw) as DraftSnapshotV2;
      // Restore form values but NEVER restore bucketIndex — always start at the about screen.
      // The saved index is kept in savedBucketIndex so the user can resume via the CTA on about.
      this.savedBucketIndex = snapshot.savedBucketIndex ?? 0;
      this.selectedProfileId = snapshot.selectedProfileId ?? '';
      this.entryPhone = snapshot.entryPhone ?? '';
      this.entryEmail = snapshot.entryEmail ?? '';
      this.isReturningCustomer = snapshot.isReturningCustomer ?? false;
      this.returningCustomerChecked = !!snapshot.entryPhone;
      this.bvn = snapshot.bvn ?? '';
      this.bvnVerified = snapshot.bvnVerified ?? false;
      this.selectedIncomeMethod = snapshot.selectedIncomeMethod ?? null;
      this.values = snapshot.values ?? {};
      this.bankName = snapshot.bankName ?? '';
      this.accountNumber = snapshot.accountNumber ?? '';
      this.accountFetched = snapshot.accountFetched ?? false;
      this.accountName = snapshot.accountName ?? '';
      this.fetchedMonthlyIncome = snapshot.fetchedMonthlyIncome ?? 0;
      this.loanAmount = snapshot.loanAmount ?? '';
      this.loanTenor = snapshot.loanTenor ?? '';
      this.mandateBankName = snapshot.mandateBankName ?? '';
      this.mandateAccountNumber = snapshot.mandateAccountNumber ?? '';
      this.mandateConsent = snapshot.mandateConsent ?? false;
      this.bnplVendor = snapshot.bnplVendor ?? '';
      this.bnplInvoiceAmount = snapshot.bnplInvoiceAmount ?? '';
      this.bnplInvoiceFileName = snapshot.bnplInvoiceFileName ?? '';
      this.bnplAudience = snapshot.bnplAudience ?? null;
      if (this.bvnVerified && this.bvn) {
        this.exposureMatches = this.loansService.getCrossProductExposure(this.bvn);
      }
    } catch { /* corrupt/old draft — start fresh */ }
  }

  private clearDraft() {
    try { localStorage.removeItem(this.draftKey); } catch { /* not fatal */ }
  }

  ngOnInit() {
    this.restoreDraft();
    if (this.profiles.length === 1) {
      this.selectedProfileId = this.profiles[0].profileId;
    }
  }

  ngOnDestroy() {}
}
