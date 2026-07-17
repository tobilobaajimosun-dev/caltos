import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BankSelectComponent, VideoCaptureFieldComponent } from '../../../shared/components';
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

type V2BucketId =
  | 'about' | 'entry' | 'profile' | 'personal' | 'contact' | 'address'
  | 'income-verification' | 'income-amount' | 'eligibility' | 'type-details'
  | 'documents' | 'offer' | 'mandate' | 'caltos-verify' | 'review' | 'disbursement';

interface DraftSnapshotV2 {
  bucketIndex: number;
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
  declaredRevenue: string;
  mandateBankName: string;
  mandateAccountNumber: string;
  mandateConsent: boolean;
}

const INCOME_METHOD_LABELS: Record<IncomeVerificationSource, string> = {
  remita: 'Verify via Remita',
  wacs: 'Verify via IPPIS / WACS',
  payslip: 'Upload payslip',
  'bank-statement': 'Upload bank statement',
  'business-revenue': 'Declare business revenue',
};

/**
 * The v2 borrower application flow — a redesigned bucket order (issue #47) that runs only for
 * products whose applicantProfiles all have an `audience` set. Legacy/unmigrated products keep
 * rendering through ApplyProfileFlowComponent (see ApplyComponent's routing). Ports the same
 * verify/documents/mandate/eligibility mechanics from the v1 engine, restructured into the new
 * stage order: about -> get started (+returning-customer check) -> personal/contact/address (new
 * customers only) -> income verification (audience-gated method choice) -> income amount
 * (salaried workers only) -> eligibility -> type details -> documents -> offer (accept/reject) ->
 * mandate -> Caltos Verify video -> final review -> success (with confetti).
 */
@Component({
  selector: 'app-apply-flow-v2',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DecimalPipe, BankSelectComponent, VideoCaptureFieldComponent],
  templateUrl: './apply-flow-v2.component.html',
  styleUrls: ['../apply-profile-flow/apply-profile-flow.component.scss', './apply-flow-v2.component.scss'],
})
export class ApplyFlowV2Component implements OnInit, OnDestroy {
  product = input.required<LoanConfig>();
  productId = input.required<string>();
  orgLogoDataUrl = input<string | null>(null);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly loansService = inject(LoansService);
  private readonly customersService = inject(CustomersService);

  readonly fieldDefs = FIELD_DEFS;
  readonly incomeMethodLabels = INCOME_METHOD_LABELS;

  // ── Bucket state machine ─────────────────────────────────────────────────────
  bucketIndex = 0;

  /** Products with no Applicant Profiles configured (most products created before that field
   * existed) get one synthesized on the fly — same fallback ApplyComponent.useV2Flow uses to
   * decide whether to route here in the first place, so this must stay in sync with that check. */
  get profiles(): ApplicantProfile[] {
    const configured = this.product().applicantProfiles ?? [];
    return configured.length ? configured : [synthesizeDefaultProfile(this.product())];
  }

  get skipProfileBucket(): boolean {
    return this.profiles.length <= 1;
  }

  get bucketOrder(): V2BucketId[] {
    const buckets: V2BucketId[] = ['about', 'entry'];
    if (!this.skipProfileBucket) buckets.push('profile');
    if (!this.isReturningCustomer) buckets.push('personal', 'contact', 'address');
    buckets.push('income-verification');
    if (this.selectedProfile?.audience === 'salaried-worker') buckets.push('income-amount');
    buckets.push('eligibility', 'type-details', 'documents', 'offer', 'mandate', 'caltos-verify', 'review', 'disbursement');
    return buckets;
  }

  get currentBucket(): V2BucketId {
    return this.bucketOrder[this.bucketIndex] ?? 'about';
  }

  get progress(): number {
    return (this.bucketIndex / Math.max(this.bucketOrder.length - 1, 1)) * 100;
  }

  /** True once the borrower has moved past "Get started" — the persistent header (product +
   * lender name) shows from here onward; the "about" screen already has the full intro. */
  get showHeader(): boolean {
    return this.currentBucket !== 'about';
  }

  next() {
    if (this.currentBucket === 'entry' && !this.returningCustomerChecked) {
      this.checkReturningCustomer();
    }
    if (this.bucketIndex < this.bucketOrder.length - 1) {
      this.bucketIndex++;
      this.saveDraft();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // ── Get started + returning-customer detection ───────────────────────────────
  entryPhone = '';
  entryEmail = '';
  isReturningCustomer = false;
  returningCustomerChecked = false;

  get entryCanContinue(): boolean {
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

  // ── Applicant profile selector ───────────────────────────────────────────────
  selectedProfileId = '';

  get selectedProfile(): ApplicantProfile | undefined {
    return this.profiles.find((p) => p.profileId === this.selectedProfileId) ?? this.profiles[0];
  }

  selectProfile(id: string) {
    this.selectedProfileId = id;
    this.next();
  }

  // ── Personal / Contact / Address (new customers only) ────────────────────────
  values: Record<string, string> = {};
  touched = new Set<string>();

  get personalFields() {
    return (this.selectedProfile?.fieldsRequired ?? []).filter((k) => this.fieldDefs[k].screenCategory === 'personal');
  }

  get addressFields() {
    return (this.selectedProfile?.fieldsRequired ?? []).filter((k) => this.fieldDefs[k].screenCategory === 'address');
  }

  /** Work/business fields shown in the post-eligibility type-details bucket — excludes
   * monthlyIncome, which is either its own income-amount bucket (salaried workers) or derived
   * from the income-verification fetch (everyone else), never asked here. */
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
    return this.personalFields.every((k) => !!this.values[k]);
  }

  get addressCanContinue(): boolean {
    return this.addressFields.every((k) => !!this.values[k]);
  }

  get typeDetailsCanContinue(): boolean {
    return this.typeDetailFields.every((k) => !!this.values[k]);
  }

  // ── Income verification (audience-gated method choice) ──────────────────────
  bvn = '';
  bvnOtpOpen = false;
  bvnOtpCode = '';
  bvnVerified = false;
  exposureMatches: { productName: string; loanUniqueId: string; status: string }[] = [];

  selectedIncomeMethod: IncomeVerificationSource | null = null;

  get allowedIncomeMethods(): IncomeVerificationSource[] {
    const audience = this.selectedProfile?.audience;
    return audience ? AUDIENCE_INCOME_METHODS[audience] : (this.selectedProfile ? [this.selectedProfile.incomeVerificationSource] : []);
  }

  get effectiveIncomeMethod(): IncomeVerificationSource | null {
    if (this.selectedIncomeMethod) return this.selectedIncomeMethod;
    return this.allowedIncomeMethods.length === 1 ? this.allowedIncomeMethods[0] : null;
  }

  selectIncomeMethod(method: IncomeVerificationSource) {
    this.selectedIncomeMethod = method;
  }

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

  bankName = '';
  accountNumber = '';
  fetchingAccount = false;
  accountFetched = false;
  accountName = '';
  /** Monthly income derived from the income-verification fetch — used for eligibility scoring
   * on every audience except salaried-worker, which collects it directly (income-amount bucket). */
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

  declaredRevenue = '';

  onDeclaredRevenueInput(raw: string) {
    this.declaredRevenue = formatThousands(raw);
    this.fetchedMonthlyIncome = parseThousands(this.declaredRevenue) / 12;
  }

  onIncomeDocFileChange(key: string, event: Event) {
    this.onDocFileChange(key, event);
    if (this.isDocComplete(key)) {
      this.fetchedMonthlyIncome = this.fetchedMonthlyIncome || 150_000;
      this.saveDraft();
    }
  }

  get incomeVerificationCanContinue(): boolean {
    if (!this.bvnVerified) return false;
    const method = this.effectiveIncomeMethod;
    if (!method) return false;
    if (method === 'remita' || method === 'wacs') return this.accountFetched;
    if (method === 'bank-statement') return !!this.docs['bank-statement-upload']?.fileName;
    if (method === 'payslip') return !!this.docs['payslip-upload']?.fileName;
    if (method === 'business-revenue') return !!this.declaredRevenue;
    return true;
  }

  // ── Income amount (salaried workers only) ────────────────────────────────────
  get incomeAmountCanContinue(): boolean {
    return !!this.values['monthlyIncome'];
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

  // ── Eligibility ───────────────────────────────────────────────────────────────
  isCalculatingEligibility = false;
  eligibilityResult: EligibilityResult | null = null;
  loanAmount = '';
  loanTenor = '';

  private buildEligibilityInput(): EligibilityInput {
    const method = this.effectiveIncomeMethod;
    const incomeSourceMap: Record<string, IncomeSource> = { wacs: 'wacs', remita: 'remita', payslip: 'other', 'bank-statement': 'other', 'business-revenue': 'other' };
    const monthlyAmount = this.selectedProfile?.audience === 'salaried-worker'
      ? parseThousands(this.values['monthlyIncome'] || '0')
      : this.fetchedMonthlyIncome;
    return {
      income: { source: incomeSourceMap[method ?? 'other'] ?? 'other', monthlyAmount },
      stability: this.selectedProfile?.audience === 'sme-owner'
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
        this.loanAmount = String(result.maxEligibleAmount);
        this.loanTenor = String(result.tenorMonths);
      }
      this.saveDraft();
      this.cdr.markForCheck();
    }, 1500);
  }

  /** Editing the desired amount clamps to the score-derived ceiling rather than re-running
   * scoreEligibility() — matches a standard loan-calculator UX (fixed cap, live recompute).
   * When the clamped result equals the value already bound to [value] (e.g. the borrower typed
   * above the ceiling and got clamped straight back to it), Angular's binding-diff sees no change
   * from its own last-set value and skips re-writing the DOM, leaving the borrower's raw keystrokes
   * visibly stuck on screen — so the input element is written to directly as a fallback. */
  onLoanAmountInput(raw: string, inputEl: HTMLInputElement) {
    const max = this.eligibilityResult?.maxEligibleAmount ?? 0;
    const parsed = Math.min(parseThousands(raw), max);
    this.loanAmount = String(parsed);
    inputEl.value = this.loanAmountDisplay;
    this.cdr.markForCheck();
  }

  get loanAmountDisplay(): string {
    return this.loanAmount ? formatThousands(this.loanAmount) : '';
  }

  get monthlyEst(): number {
    return estimateMonthlyRepayment(+this.loanAmount || 0, +this.loanTenor || 1, +(this.product().interestRate || 0));
  }

  // ── Offer (accept / reject) ──────────────────────────────────────────────────
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
      customerName: this.values['fullName'] || this.accountName || 'Applicant',
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
    this.jumpTo('eligibility');
  }

  exitApplication() {
    this.offerExited = true;
  }

  // ── Mandate setup (always after offer acceptance in v2) ──────────────────────
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

  // ── Caltos Verify (borrower-facing video, post-offer-acceptance) ────────────
  caltosVerifyVideo: string | null = null;

  onCaltosVerifyVideoChange(dataUrl: string | null) {
    this.caltosVerifyVideo = dataUrl;
    this.saveDraft();
  }

  get caltosVerifyCanContinue(): boolean {
    return !!this.caltosVerifyVideo;
  }

  // ── Review & submit ───────────────────────────────────────────────────────────
  submitted = false;
  refNumber = '';

  railName(id: string): string {
    return DEDUCTION_CHANNEL_DEFS[id]?.name ?? id;
  }

  submit() {
    if (!this.selectedProfile) return;
    const created = this.loansService.create({
      productId: this.productId(),
      applicantIdentifier: this.bvn,
      customerName: this.values['fullName'] || this.accountName || 'Applicant',
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
    // next() unconditionally re-saves a draft snapshot for the bucket it just entered — clear
    // *after* so a reload of the success screen starts a brand-new application rather than
    // replaying this completed one indefinitely.
    this.clearDraft();
    this.triggerConfetti();
  }

  /** Records this applicant as a known customer so a future application with the same phone
   * number is recognized as returning (see checkReturningCustomer) — without this, the
   * new-vs-returning detection could never actually trigger since nothing else in the app writes
   * borrower-submitted contact details into CustomersService. */
  private upsertCustomerRecord() {
    const name = this.values['fullName'] || this.accountName || 'Applicant';
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

  // ── Confetti (hand-built CSS/DOM particles, no new dependency) ──────────────
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

  // ── Autosave ──────────────────────────────────────────────────────────────────
  private get draftKey(): string {
    return `caltos_apply_v2_draft_${this.productId()}`;
  }

  private saveDraft() {
    const snapshot: DraftSnapshotV2 = {
      bucketIndex: this.bucketIndex,
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
      declaredRevenue: this.declaredRevenue,
      mandateBankName: this.mandateBankName,
      mandateAccountNumber: this.mandateAccountNumber,
      mandateConsent: this.mandateConsent,
    };
    try {
      localStorage.setItem(this.draftKey, JSON.stringify(snapshot));
    } catch {
      // Best-effort only — losing autosave shouldn't block the flow.
    }
  }

  private restoreDraft() {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (!raw) return;
      const snapshot = JSON.parse(raw) as DraftSnapshotV2;
      this.bucketIndex = snapshot.bucketIndex ?? 0;
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
      this.declaredRevenue = snapshot.declaredRevenue ?? '';
      this.mandateBankName = snapshot.mandateBankName ?? '';
      this.mandateAccountNumber = snapshot.mandateAccountNumber ?? '';
      this.mandateConsent = snapshot.mandateConsent ?? false;
      if (this.bvnVerified && this.bvn) {
        this.exposureMatches = this.loansService.getCrossProductExposure(this.bvn);
      }
    } catch {
      // Corrupt/old-shape draft — start fresh rather than throwing.
    }
  }

  private clearDraft() {
    try {
      localStorage.removeItem(this.draftKey);
    } catch {
      // Not fatal — the draft is best-effort.
    }
  }

  ngOnInit() {
    this.restoreDraft();
    if (this.profiles.length === 1) this.selectedProfileId = this.profiles[0].profileId;
  }

  ngOnDestroy() {}
}
