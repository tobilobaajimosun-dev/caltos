import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BankSelectComponent, VideoCaptureFieldComponent } from '../../../shared/components';
import { ApplicantProfile, DEDUCTION_CHANNEL_DEFS } from '../../../shared/services/products.service';
import { LoansService } from '../../../shared/services/loans.service';
import { LoanConfig } from '../../loans/create-loan/create-loan.component';
import { formatThousands, parseThousands } from '../../../shared/utils/number-format';
import {
  EligibilityConfig, EligibilityInput, EligibilityResult, IncomeSource,
  DEFAULT_ELIGIBILITY_CONFIG, scoreEligibility,
} from '../../../shared/utils/eligibility-scoring';
import { FIELD_DEFS } from './field-defs';
import { MANDATE_RAIL_COPY, DEFAULT_MANDATE_COPY } from './mandate-copy';

type ProfileBucketId = 'entry' | 'profile' | 'verify' | 'details' | 'documents' | 'mandate' | 'eligibility' | 'review' | 'disbursement';

interface DraftSnapshot {
  bucketIndex: number;
  selectedProfileId: string;
  entryPhone: string;
  entryEmail: string;
  bvn: string;
  bvnVerified: boolean;
  values: Record<string, string>;
  bankName: string;
  accountNumber: string;
  accountName: string;
  declaredRevenue: string;
  mandateBankName: string;
  mandateAccountNumber: string;
  mandateConsent: boolean;
}

/**
 * Generic, fixed 9-bucket borrower application flow driven entirely by a product's
 * ApplicantProfile config (products.service.ts) — additive to, and completely independent of,
 * the legacy per-loan-type flow in apply.component.ts. Rendered by ApplyComponent only when
 * product.applicantProfiles is non-empty.
 */
@Component({
  selector: 'app-apply-profile-flow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DecimalPipe, BankSelectComponent, VideoCaptureFieldComponent],
  templateUrl: './apply-profile-flow.component.html',
  styleUrl: './apply-profile-flow.component.scss',
})
export class ApplyProfileFlowComponent implements OnInit, OnDestroy {
  product = input.required<LoanConfig>();
  productId = input.required<string>();

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly loansService = inject(LoansService);

  readonly fieldDefs = FIELD_DEFS;

  // ── Bucket state machine ─────────────────────────────────────────────────────
  bucketIndex = 0;

  get profiles(): ApplicantProfile[] {
    return this.product().applicantProfiles ?? [];
  }

  get skipProfileBucket(): boolean {
    return this.profiles.length <= 1;
  }

  get bucketOrder(): ProfileBucketId[] {
    const timing = this.selectedProfile?.mandateTiming ?? 'post_approval';
    const middle: ProfileBucketId[] = timing === 'inline' ? ['mandate', 'eligibility'] : ['eligibility', 'mandate'];
    const buckets: ProfileBucketId[] = ['entry'];
    if (!this.skipProfileBucket) buckets.push('profile');
    buckets.push('verify', 'details', 'documents', ...middle, 'review', 'disbursement');
    return buckets;
  }

  get currentBucket(): ProfileBucketId {
    return this.bucketOrder[this.bucketIndex] ?? 'entry';
  }

  get progress(): number {
    return (this.bucketIndex / Math.max(this.bucketOrder.length - 1, 1)) * 100;
  }

  next() {
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

  jumpTo(bucket: ProfileBucketId) {
    const idx = this.bucketOrder.indexOf(bucket);
    if (idx >= 0) this.bucketIndex = idx;
  }

  // ── Bucket 1: entry identifier ───────────────────────────────────────────────
  entryPhone = '';
  entryEmail = '';

  get entryCanContinue(): boolean {
    return !!this.entryPhone || !!this.entryEmail;
  }

  // ── Bucket 2: applicant profile selector ─────────────────────────────────────
  selectedProfileId = '';

  get selectedProfile(): ApplicantProfile | undefined {
    return this.profiles.find((p) => p.profileId === this.selectedProfileId) ?? this.profiles[0];
  }

  selectProfile(id: string) {
    this.selectedProfileId = id;
    this.next();
  }

  // ── Bucket 3: verification (BVN always + profile's incomeVerificationSource) ─
  bvn = '';
  bvnOtpOpen = false;
  bvnOtpCode = '';
  bvnVerified = false;

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

  exposureMatches: { productName: string; loanUniqueId: string; status: string }[] = [];

  // Remita/WACS-style account verification (shared shape — the specific rail is cosmetic here,
  // since the borrower never sees rail names, only "your salary"/"your account").
  bankName = '';
  accountNumber = '';
  fetchingAccount = false;
  accountFetched = false;
  accountName = '';

  fetchAccountDetails() {
    if (!this.bankName || !this.accountNumber) return;
    this.fetchingAccount = true;
    setTimeout(() => {
      this.fetchingAccount = false;
      this.accountFetched = true;
      this.accountName = 'Aisha Bello';
      this.cdr.markForCheck();
    }, 1200);
  }

  // Business-revenue self-declaration — no external fetch, just a declared figure.
  declaredRevenue = '';

  onDeclaredRevenueInput(raw: string) {
    this.declaredRevenue = formatThousands(raw);
  }

  get verificationCanContinue(): boolean {
    if (!this.bvnVerified) return false;
    const source = this.selectedProfile?.incomeVerificationSource;
    if (source === 'remita' || source === 'wacs') return this.accountFetched;
    if (source === 'bank-statement') return !!this.docs['bank-statement-upload']?.fileName;
    if (source === 'business-revenue') return !!this.declaredRevenue;
    return true;
  }

  // ── Bucket 4: profile-specific details (generic field renderer) ─────────────
  values: Record<string, string> = {};
  touched = new Set<string>();

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

  /** Format-specific inline validators for the small set of fixed-shape fields outside the
   * generic per-profile field bag (bvn/phone/account-number length checks), shown on blur. */
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

  get detailsCanContinue(): boolean {
    return (this.selectedProfile?.fieldsRequired ?? []).every((k) => !!this.values[k]);
  }

  // ── Bucket 5: documents ───────────────────────────────────────────────────────
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

  // ── Mandate setup ─────────────────────────────────────────────────────────────
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

  // ── Eligibility ───────────────────────────────────────────────────────────────
  isCalculatingEligibility = false;
  eligibilityResult: EligibilityResult | null = null;
  loanAmount = '';
  loanTenor = '';

  private buildEligibilityInput(): EligibilityInput {
    const source = this.selectedProfile?.incomeVerificationSource;
    const incomeSourceMap: Record<string, IncomeSource> = { wacs: 'wacs', remita: 'remita', 'bank-statement': 'other', 'business-revenue': 'other' };
    const monthlyAmount = source === 'business-revenue'
      ? parseThousands(this.declaredRevenue) / 12
      : parseThousands(this.values['monthlyIncome'] || '0');
    return {
      income: { source: incomeSourceMap[source ?? 'other'] ?? 'other', monthlyAmount },
      stability: this.selectedProfile?.fieldsRequired.includes('businessCacNumber')
        ? { type: 'mda', category: 'sme' }
        : { type: 'mda', category: 'private-large' },
      repaymentHistory: { isRepeatBorrower: false },
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

  get monthlyEst(): number {
    const rate = +(this.product().interestRate || 0) / 100;
    return Math.ceil((+this.loanAmount * (1 + rate)) / (+this.loanTenor || 1));
  }

  // ── Review & submit ───────────────────────────────────────────────────────────
  submitted = false;
  refNumber = '';

  get customerName(): string {
    return this.accountName || this.mandateBankName ? (this.accountName || 'Applicant') : 'Applicant';
  }

  submit() {
    if (!this.selectedProfile) return;
    const created = this.loansService.create({
      productId: this.productId(),
      applicantIdentifier: this.bvn,
      customerName: this.accountName || 'Applicant',
      customerPhone: this.entryPhone,
      customerEmail: this.entryEmail,
      customerPhoto: '',
      amount: +this.loanAmount,
      tenor: +this.loanTenor,
      interestRate: +(this.product().interestRate || 0),
      totalRepayment: this.monthlyEst * (+this.loanTenor || 1),
      monthlyRepayment: this.monthlyEst,
      workplace: this.values['employerName'] || this.values['businessName'] || '',
      workplaceIdNumber: this.values['staffId'] || '',
      telephoneNumber: this.entryPhone,
      salaryBankName: this.mandateBankName,
      salaryBankAccount: this.mandateAccountNumber,
      referralCode: this.route.snapshot.queryParamMap.get('ref') ?? '',
      status: 'new',
      verificationResults: {
        bvnVerified: this.bvnVerified,
        secondaryCheckPassed: this.bvnVerified,
        mismatchFlags: [],
      },
      eligibilityScore: {
        score: this.eligibilityResult?.score ?? 0,
        maxEligibleAmount: this.eligibilityResult?.maxEligibleAmount ?? (+this.loanAmount || 0),
        tenor: this.eligibilityResult?.tenorMonths ?? (+this.loanTenor || 0),
        breakdown: this.eligibilityResult?.breakdown,
      },
      requiredDocuments: (this.selectedProfile.requiredDocuments ?? []).map((d) => ({
        type: d.label,
        uploaded: this.isDocComplete(d.key),
        approved: this.isDocComplete(d.key),
      })),
      deductionChannelStatus: this.loansService.buildDeductionChannelStatus(this.productId()),
      utmSource: this.route.snapshot.queryParamMap.get('utm_source') ?? 'direct',
      utmMedium: this.route.snapshot.queryParamMap.get('utm_medium') ?? 'organic',
    });
    this.refNumber = created.loanUniqueId;
    this.clearDraft();
    this.next();
  }

  // ── Mandate rail label helper (plain-language, never shown to the borrower verbatim) ──
  railName(id: string): string {
    return DEDUCTION_CHANNEL_DEFS[id]?.name ?? id;
  }

  // ── Autosave ──────────────────────────────────────────────────────────────────
  private get draftKey(): string {
    return `caltos_apply_draft_${this.productId()}`;
  }

  private saveDraft() {
    const snapshot: DraftSnapshot = {
      bucketIndex: this.bucketIndex,
      selectedProfileId: this.selectedProfileId,
      entryPhone: this.entryPhone,
      entryEmail: this.entryEmail,
      bvn: this.bvn,
      bvnVerified: this.bvnVerified,
      values: this.values,
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      accountName: this.accountName,
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
      const snapshot = JSON.parse(raw) as DraftSnapshot;
      this.bucketIndex = snapshot.bucketIndex ?? 0;
      this.selectedProfileId = snapshot.selectedProfileId ?? '';
      this.entryPhone = snapshot.entryPhone ?? '';
      this.entryEmail = snapshot.entryEmail ?? '';
      this.bvn = snapshot.bvn ?? '';
      this.bvnVerified = snapshot.bvnVerified ?? false;
      this.values = snapshot.values ?? {};
      this.bankName = snapshot.bankName ?? '';
      this.accountNumber = snapshot.accountNumber ?? '';
      this.accountName = snapshot.accountName ?? '';
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
