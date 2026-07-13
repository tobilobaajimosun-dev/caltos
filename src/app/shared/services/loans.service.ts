import { Injectable, computed, inject, signal } from '@angular/core';
import { ProductsService, ProductRecord, ProductConfig, DEFAULT_PRODUCT_CONFIG, DeductionChannelStatus, effectiveChannelStatus } from './products.service';
import { NotificationDeliveryService } from './notification-delivery.service';

export type LoanStatus = 'new' | 'declined' | 'documents_review' | 'closed' | 'disbursed' | 'top_up_request';

export interface VerificationResults {
  bvnVerified: boolean;
  secondaryCheckPassed: boolean;
  mismatchFlags: string[];
}

export interface EligibilityScoreResult {
  score: number;
  maxEligibleAmount: number;
  tenor: number;
}

export interface RequiredDocument {
  type: string;
  uploaded: boolean;
  approved: boolean;
}

export interface DeductionChannelStatusEntry {
  rail: string;
  status: DeductionChannelStatus;
  lastAttempt: string;
  result: string;
}

export interface ActivityLogEntry {
  timestamp: string;
  event: string;
  actor: string;
}

/**
 * The full commercial terms of a product at the moment an application was filed —
 * the entire ProductConfig (eligibility, fees, deduction channel definitions, etc.)
 * plus the rate/amount/tenor fields that live directly on ProductRecord. Captured
 * once at creation and never re-read from the live ProductRecord, so editing a
 * product later (rate change, eligibility rule change, deduction channel change)
 * never retroactively changes the terms an existing loan was created under.
 */
export interface ProductTermsSnapshot extends ProductConfig {
  interestRate: string;
  interestType: string;
  interestFrequency: string;
  minAmount: string;
  maxAmount: string;
  minTenor: string;
  maxTenor: string;
  tenorUnit: string;
}

function buildTermsSnapshot(product: ProductRecord | undefined): ProductTermsSnapshot {
  if (!product) {
    return {
      ...structuredClone(DEFAULT_PRODUCT_CONFIG),
      interestRate: '0', interestType: '', interestFrequency: '',
      minAmount: '0', maxAmount: '0', minTenor: '0', maxTenor: '0', tenorUnit: '',
    };
  }
  return {
    ...structuredClone(product.config),
    interestRate: product.interestRate,
    interestType: product.interestType,
    interestFrequency: product.interestFrequency,
    minAmount: product.minAmount,
    maxAmount: product.maxAmount,
    minTenor: product.minTenor,
    maxTenor: product.maxTenor,
    tenorUnit: product.tenorUnit,
  };
}

export interface LoanApplication {
  id: string;
  loanUniqueId: string;
  productId: string;
  applicantIdentifier: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerPhoto: string;
  amount: number;
  tenor: number;
  interestRate: number;
  totalRepayment: number;
  monthlyRepayment: number;
  workplace: string;
  workplaceIdNumber: string;
  telephoneNumber: string;
  salaryBankName: string;
  salaryBankAccount: string;
  referralCode: string;
  status: LoanStatus;
  verificationResults: VerificationResults;
  eligibilityScore: EligibilityScoreResult;
  requiredDocuments: RequiredDocument[];
  deductionChannelStatus: DeductionChannelStatusEntry[];
  productConfigSnapshot: ProductTermsSnapshot;
  /** Set once a reviewer approves this loan from the manual review queue — keeps it from
   * reappearing in the queue just because its score/mismatch flags are still technically borderline. */
  manualReviewCleared?: boolean;
  activityLog: ActivityLogEntry[];
  utmSource: string;
  utmMedium: string;
  appliedAt: string;
  updatedAt: string;
}

/** LoanStatus values that still count as "in the pipeline" — not yet decided either way. */
const UNRESOLVED_STATUSES: LoanStatus[] = ['new', 'documents_review'];

/** Eligibility scores in this band are neither a clean approve nor a clean decline. */
export const BORDERLINE_SCORE_MIN = 40;
export const BORDERLINE_SCORE_MAX = 70;

/** Reasons a loan is sitting in the manual review queue — verification mismatches plus a borderline score. */
export function manualReviewReasons(loan: LoanApplication): string[] {
  const reasons = [...loan.verificationResults.mismatchFlags];
  if (loan.eligibilityScore.score >= BORDERLINE_SCORE_MIN && loan.eligibilityScore.score <= BORDERLINE_SCORE_MAX) {
    reasons.push(`Borderline eligibility score (${loan.eligibilityScore.score}/100)`);
  }
  return reasons;
}

/** Only still-pipeline, not-yet-cleared loans with an active flag belong in the queue. */
export function needsManualReview(loan: LoanApplication): boolean {
  return !loan.manualReviewCleared && UNRESOLVED_STATUSES.includes(loan.status) && manualReviewReasons(loan).length > 0;
}

const STORAGE_KEY = 'caltos_loans';

/** Sample data for a "Load demo data" action — never auto-seeded, so a fresh browser starts empty. */
export function demoLoans(productsService: ProductsService): LoanApplication[] {
  const rows: Omit<LoanApplication, 'productConfigSnapshot'>[] = [
    {
      id: 'LN0001', loanUniqueId: 'CW001-0001', productId: 'CW001',
      applicantIdentifier: '22190034561', customerName: 'Akpan Akporigomayen', customerPhone: '08034760349', customerEmail: 'akpan.akporigomayen@example.com', customerPhoto: '',
      amount: 150_000, tenor: 6, interestRate: 7.5, totalRepayment: 165_000, monthlyRepayment: 27_500,
      workplace: 'Federal Ministry of Works', workplaceIdNumber: 'IPPIS/2024/00821', telephoneNumber: '08034760349',
      salaryBankName: 'GTBank', salaryBankAccount: '0234567891', referralCode: 'REF-AKP20',
      status: 'disbursed',
      verificationResults: { bvnVerified: true, secondaryCheckPassed: true, mismatchFlags: [] },
      eligibilityScore: { score: 88.5, maxEligibleAmount: 210_000, tenor: 9 },
      requiredDocuments: [
        { type: 'National ID (NIN)', uploaded: true, approved: true },
        { type: 'Last 3 months payslip', uploaded: true, approved: true },
      ],
      deductionChannelStatus: [
        { rail: 'Remita', status: 'live', lastAttempt: '2026-06-30', result: 'Deducted ₦27,500 successfully' },
        { rail: 'IPPIS', status: 'test_passed', lastAttempt: '2026-06-01', result: 'Not yet attempted' },
      ],
      activityLog: [
        { timestamp: '2026-06-02 09:14', event: 'Application submitted via public apply portal', actor: 'System' },
        { timestamp: '2026-06-02 09:20', event: 'BVN and identity verification passed', actor: 'System' },
        { timestamp: '2026-06-02 10:05', event: 'Application approved', actor: 'T. Adeyemi' },
        { timestamp: '2026-06-03 08:00', event: 'Loan disbursed — ₦150,000 to salary account', actor: 'System' },
      ],
      utmSource: 'facebook', utmMedium: 'social', appliedAt: '2026-06-02 09:14', updatedAt: '2026-06-03 08:00',
    },
    {
      id: 'LN0002', loanUniqueId: 'CRI02-0001', productId: 'CRI02',
      applicantIdentifier: '22190045672', customerName: 'Bola Adebayo', customerPhone: '08123456780', customerEmail: 'bola.adebayo@example.com', customerPhoto: '',
      amount: 75_000, tenor: 3, interestRate: 7.5, totalRepayment: 78_900, monthlyRepayment: 26_300,
      workplace: 'Lagos State Government', workplaceIdNumber: 'IPPIS/2024/01143', telephoneNumber: '08123456780',
      salaryBankName: 'Access Bank', salaryBankAccount: '0198765432', referralCode: '',
      status: 'new',
      verificationResults: { bvnVerified: true, secondaryCheckPassed: false, mismatchFlags: [] },
      eligibilityScore: { score: 71.2, maxEligibleAmount: 90_000, tenor: 6 },
      requiredDocuments: [
        { type: 'National ID (NIN)', uploaded: true, approved: false },
        { type: 'Utility Bill', uploaded: false, approved: false },
      ],
      deductionChannelStatus: [
        { rail: 'IPPIS', status: 'credentials_saved', lastAttempt: '', result: 'Not yet attempted' },
      ],
      activityLog: [
        { timestamp: '2026-06-05 07:40', event: 'Application submitted via public apply portal', actor: 'System' },
        { timestamp: '2026-06-05 07:41', event: 'BVN verification passed', actor: 'System' },
      ],
      utmSource: 'direct', utmMedium: 'organic', appliedAt: '2026-06-05 07:40', updatedAt: '2026-06-05 07:41',
    },
    {
      id: 'LN0003', loanUniqueId: 'CA100-0001', productId: 'CA100',
      applicantIdentifier: '22190098213', customerName: 'Chika Okafor', customerPhone: '08098765432', customerEmail: 'chika.okafor@example.com', customerPhoto: '',
      amount: 320_000, tenor: 12, interestRate: 7.5, totalRepayment: 358_800, monthlyRepayment: 29_900,
      workplace: 'Dangote Group', workplaceIdNumber: 'IPPIS/2023/00456', telephoneNumber: '08098765432',
      salaryBankName: 'Zenith Bank', salaryBankAccount: '0221334455', referralCode: 'REF-CHK09',
      status: 'documents_review',
      verificationResults: { bvnVerified: true, secondaryCheckPassed: true, mismatchFlags: ['Name on payslip differs slightly from BVN record'] },
      eligibilityScore: { score: 64.0, maxEligibleAmount: 210_000, tenor: 6 },
      requiredDocuments: [
        { type: 'National ID (NIN)', uploaded: true, approved: true },
        { type: 'Utility Bill', uploaded: true, approved: false },
        { type: 'Last 3 months payslip', uploaded: false, approved: false },
        { type: 'Bank statement (6 months)', uploaded: false, approved: false },
      ],
      deductionChannelStatus: [
        { rail: 'Dedukt', status: 'not_configured', lastAttempt: '', result: 'Not yet attempted' },
      ],
      activityLog: [
        { timestamp: '2026-05-28 11:02', event: 'Application submitted via public apply portal', actor: 'System' },
        { timestamp: '2026-05-28 11:03', event: 'BVN verification passed with a name-mismatch flag', actor: 'System' },
        { timestamp: '2026-05-29 09:15', event: 'Moved to documents review — awaiting payslip and bank statement', actor: 'B. Nwachukwu' },
      ],
      utmSource: 'google', utmMedium: 'cpc', appliedAt: '2026-05-28 11:02', updatedAt: '2026-05-29 09:15',
    },
    {
      id: 'LN0004', loanUniqueId: 'WCR03-0001', productId: 'WCR03',
      applicantIdentifier: '22190011209', customerName: 'Damilola Ojo', customerPhone: '08145678901', customerEmail: 'damilola.ojo@example.com', customerPhoto: '',
      amount: 45_000, tenor: 9, interestRate: 7.5, totalRepayment: 47_700, monthlyRepayment: 5_300,
      workplace: 'NYSC Corps Members', workplaceIdNumber: 'IPPIS/2024/02219', telephoneNumber: '08145678901',
      salaryBankName: 'UBA', salaryBankAccount: '0209988776', referralCode: '',
      status: 'declined',
      verificationResults: { bvnVerified: false, secondaryCheckPassed: false, mismatchFlags: ['BVN could not be verified against NIMC records'] },
      eligibilityScore: { score: 22.0, maxEligibleAmount: 0, tenor: 0 },
      requiredDocuments: [
        { type: 'National ID (NIN)', uploaded: true, approved: false },
      ],
      deductionChannelStatus: [
        { rail: 'WACS', status: 'credentials_saved', lastAttempt: '', result: 'Not yet attempted' },
      ],
      activityLog: [
        { timestamp: '2026-06-10 06:55', event: 'Application submitted via public apply portal', actor: 'System' },
        { timestamp: '2026-06-10 06:56', event: 'BVN verification failed', actor: 'System' },
        { timestamp: '2026-06-10 12:00', event: 'Application declined — identity could not be verified', actor: 'System' },
      ],
      utmSource: 'direct', utmMedium: 'organic', appliedAt: '2026-06-10 06:55', updatedAt: '2026-06-10 12:00',
    },
    {
      id: 'LN0005', loanUniqueId: 'CW001-0002', productId: 'CW001',
      applicantIdentifier: '22190076554', customerName: 'Emeka Nwosu', customerPhone: '08011122233', customerEmail: 'emeka.nwosu@example.com', customerPhoto: '',
      amount: 210_000, tenor: 6, interestRate: 7.5, totalRepayment: 231_000, monthlyRepayment: 38_500,
      workplace: 'Federal Ministry of Works', workplaceIdNumber: 'IPPIS/2022/00981', telephoneNumber: '08011122233',
      salaryBankName: 'First Bank', salaryBankAccount: '0301122334', referralCode: 'REF-EME77',
      status: 'top_up_request',
      verificationResults: { bvnVerified: true, secondaryCheckPassed: true, mismatchFlags: [] },
      eligibilityScore: { score: 92.0, maxEligibleAmount: 300_000, tenor: 12 },
      requiredDocuments: [
        { type: 'National ID (NIN)', uploaded: true, approved: true },
        { type: 'Last 3 months payslip', uploaded: true, approved: true },
      ],
      deductionChannelStatus: [
        { rail: 'Remita', status: 'live', lastAttempt: '2026-06-30', result: 'Deducted ₦38,500 successfully' },
      ],
      activityLog: [
        { timestamp: '2026-05-15 08:30', event: 'Application submitted via public apply portal', actor: 'System' },
        { timestamp: '2026-05-16 09:00', event: 'Loan disbursed — ₦210,000 to salary account', actor: 'System' },
        { timestamp: '2026-06-20 14:10', event: 'Customer requested a top-up', actor: 'Emeka Nwosu' },
      ],
      utmSource: 'referral', utmMedium: 'affiliate', appliedAt: '2026-05-15 08:30', updatedAt: '2026-06-20 14:10',
    },
    {
      id: 'LN0006', loanUniqueId: 'CRI02-0002', productId: 'CRI02',
      applicantIdentifier: '22190088342', customerName: 'Fatima Abdallah', customerPhone: '08056677889', customerEmail: 'fatima.abdallah@example.com', customerPhoto: '',
      amount: 95_000, tenor: 6, interestRate: 7.5, totalRepayment: 104_400, monthlyRepayment: 17_400,
      workplace: 'Lagos State Government', workplaceIdNumber: 'IPPIS/2023/01732', telephoneNumber: '08056677889',
      salaryBankName: 'Fidelity Bank', salaryBankAccount: '0344556677', referralCode: '',
      status: 'closed',
      verificationResults: { bvnVerified: true, secondaryCheckPassed: true, mismatchFlags: [] },
      eligibilityScore: { score: 75.0, maxEligibleAmount: 120_000, tenor: 9 },
      requiredDocuments: [
        { type: 'National ID (NIN)', uploaded: true, approved: true },
        { type: 'Utility Bill', uploaded: true, approved: true },
      ],
      deductionChannelStatus: [
        { rail: 'IPPIS', status: 'live', lastAttempt: '2026-06-30', result: 'Fully repaid — mandate cancelled' },
      ],
      activityLog: [
        { timestamp: '2026-04-20 10:00', event: 'Application submitted via public apply portal', actor: 'System' },
        { timestamp: '2026-04-21 08:00', event: 'Loan disbursed — ₦95,000 to salary account', actor: 'System' },
        { timestamp: '2026-06-30 06:00', event: 'Final installment collected — loan closed', actor: 'System' },
      ],
      utmSource: 'facebook', utmMedium: 'social', appliedAt: '2026-04-20 10:00', updatedAt: '2026-06-30 06:00',
    },
    {
      id: 'LN0007', loanUniqueId: 'QB001-0001', productId: 'QB001',
      applicantIdentifier: '22190099887', customerName: 'Gideon Mbogo', customerPhone: '08076655443', customerEmail: 'gideon.mbogo@example.com', customerPhoto: '',
      amount: 120_000, tenor: 4, interestRate: 5.0, totalRepayment: 127_200, monthlyRepayment: 31_800,
      workplace: 'Self-employed', workplaceIdNumber: '', telephoneNumber: '08076655443',
      salaryBankName: 'Moniepoint', salaryBankAccount: '0455667788', referralCode: 'REF-GID44',
      status: 'new',
      verificationResults: { bvnVerified: true, secondaryCheckPassed: false, mismatchFlags: [] },
      eligibilityScore: { score: 58.0, maxEligibleAmount: 130_000, tenor: 6 },
      requiredDocuments: [
        { type: 'Government Issued ID (Required)', uploaded: true, approved: false },
      ],
      deductionChannelStatus: [
        { rail: 'Direct Debit', status: 'live', lastAttempt: '', result: 'Not yet attempted' },
      ],
      activityLog: [
        { timestamp: '2026-06-18 13:20', event: 'Application submitted via public apply portal', actor: 'System' },
      ],
      utmSource: 'instagram', utmMedium: 'social', appliedAt: '2026-06-18 13:20', updatedAt: '2026-06-18 13:20',
    },
  ];
  return rows.map((row) => ({ ...row, productConfigSnapshot: buildTermsSnapshot(productsService.getById(row.productId)) }));
}

@Injectable({ providedIn: 'root' })
export class LoansService {
  private readonly productsService = inject(ProductsService);
  private readonly deliveryService = inject(NotificationDeliveryService);
  private readonly _loans = signal<LoanApplication[]>(this.load());
  readonly loans = this._loans.asReadonly();

  /** Every unresolved application currently flagged for manual review (mismatch or borderline score). */
  readonly manualReviewQueue = computed(() => this._loans().filter(needsManualReview));

  private load(): LoanApplication[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LoanApplication[];
        // Backfill a snapshot for records saved before this field existed.
        return parsed.map((l) =>
          l.productConfigSnapshot ? l : { ...l, productConfigSnapshot: buildTermsSnapshot(this.productsService.getById(l.productId)) },
        );
      }
    } catch {}
    return [];
  }

  /** Replaces everything with the sample loan set — an explicit, opt-in action (see product-list's empty state). */
  loadDemoData() {
    this._loans.set(demoLoans(this.productsService));
    this.persist();
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._loans()));
  }

  getById(id: string): LoanApplication | undefined {
    return this._loans().find((l) => l.id === id);
  }

  /** Next zero-padded serial for a product's loanUniqueId — e.g. CW001-0003. */
  private nextSerialForProduct(productId: string): string {
    const count = this._loans().filter((l) => l.productId === productId).length;
    return String(count + 1).padStart(4, '0');
  }

  /** Builds this product's deductionChannelStatus snapshot from its real, current config. */
  buildDeductionChannelStatus(productId: string): DeductionChannelStatusEntry[] {
    const product = this.productsService.getById(productId);
    return (product?.config.deductionChannels ?? [])
      .filter((c) => c.enabled)
      .map((c) => ({ rail: c.name, status: effectiveChannelStatus(c), lastAttempt: '', result: 'Not yet attempted' }));
  }

  /** Any LoanApplication not in a terminal state still depends on its product's channels/terms. */
  private isActiveStatus(status: LoanStatus): boolean {
    return status !== 'declined' && status !== 'closed';
  }

  hasLoansForProduct(productId: string): boolean {
    return this._loans().some((l) => l.productId === productId);
  }

  countLoansForProduct(productId: string): number {
    return this._loans().filter((l) => l.productId === productId).length;
  }

  countActiveLoansUsingChannel(productId: string, channelId: string): number {
    return this._loans().filter((l) =>
      l.productId === productId &&
      this.isActiveStatus(l.status) &&
      l.productConfigSnapshot.deductionChannels.some((c) => c.id === channelId && c.enabled),
    ).length;
  }

  /** Reason a deduction channel cannot be disabled/removed from a product, or null if it's safe to. */
  getChannelDisableBlockReason(productId: string, channelId: string, channelName: string): string | null {
    const count = this.countActiveLoansUsingChannel(productId, channelId);
    if (count === 0) return null;
    return `Cannot disable ${channelName} — ${count} active loan${count === 1 ? '' : 's'} depend${count === 1 ? 's' : ''} on it.`;
  }

  /**
   * Reason a new application from this identifier/product pair should be blocked, or null if
   * it's safe to submit. Only blocks while a prior application from the same BVN for the same
   * product is still being decided (new/documents_review) — an already-resolved (declined/
   * closed) or already-active (disbursed/top_up_request) prior loan doesn't count as a duplicate
   * application in progress.
   */
  getDuplicateApplicationBlockReason(productId: string, applicantIdentifier: string): string | null {
    if (!applicantIdentifier) return null;
    const dup = this._loans().find((l) =>
      l.productId === productId &&
      l.applicantIdentifier === applicantIdentifier &&
      UNRESOLVED_STATUSES.includes(l.status),
    );
    if (!dup) return null;
    return `An application from this BVN (${dup.loanUniqueId}) is already in progress for this product. Please wait for it to be resolved before applying again.`;
  }

  /** Approve/decline/request-more-info action from the manual review queue. */
  resolveManualReview(id: string, decision: 'approved' | 'declined' | 'more_info', note: string, actor = 'Reviewer') {
    const loan = this.getById(id);
    if (!loan) return;
    if (decision === 'approved') {
      const nextStatus: LoanStatus = loan.status === 'new' ? 'documents_review' : 'disbursed';
      // Cleared explicitly — otherwise a still-borderline score would put it right back in the
      // queue the moment a reviewer approves it, which reads as "did that even work?"
      this.update(id, { manualReviewCleared: true });
      this.setStatus(id, nextStatus, actor);
      this.addActivity(id, `Manual review: approved${note ? ' — ' + note : ''}`, actor);
    } else if (decision === 'declined') {
      this.setStatus(id, 'declined', actor);
      this.addActivity(id, `Manual review: declined${note ? ' — ' + note : ''}`, actor);
    } else {
      this.addActivity(id, `Manual review: more information requested${note ? ' — ' + note : ''}`, actor);
    }
  }

  /**
   * Notifies the customer of a status change, trying SMS first and falling back to the next
   * configured channel (per NotificationDeliveryService) if it fails — e.g. an invalid phone
   * number falls through to the in-app/dashboard channel rather than failing silently. The
   * fallback (or total failure) is logged to the loan's own activity log so it's visible.
   */
  private notifyCustomer(id: string, status: LoanStatus) {
    const loan = this.getById(id);
    if (!loan) return;
    const result = this.deliveryService.send(
      'loan-status-update',
      { phone: loan.customerPhone, email: loan.customerEmail },
      `Your application ${loan.loanUniqueId} status: ${status.replace(/_/g, ' ')}`,
    );
    if (!result.delivered) {
      const failed = result.attempts.map((a) => a.channel).join(', ');
      this.addActivity(id, `Customer notification failed on all channels (${failed}).`, 'System');
    } else if (result.channel !== 'sms') {
      const primaryFailure = result.attempts[0];
      this.addActivity(id, `SMS notification failed (${primaryFailure?.reason}) — delivered via ${result.channel} instead.`, 'System');
    }
  }

  create(partial: Omit<LoanApplication, 'id' | 'loanUniqueId' | 'activityLog' | 'appliedAt' | 'updatedAt' | 'productConfigSnapshot'> & {
    activityLog?: ActivityLogEntry[];
  }): LoanApplication {
    const now = new Date().toISOString();
    const id = 'LN' + Date.now().toString(36).toUpperCase();
    const loanUniqueId = `${partial.productId}-${this.nextSerialForProduct(partial.productId)}`;
    // Snapshotted once, here, from the live ProductRecord — this loan keeps these terms
    // forever, even if the product's rate/eligibility/fees/channels are edited later.
    const productConfigSnapshot = buildTermsSnapshot(this.productsService.getById(partial.productId));
    const record: LoanApplication = {
      ...partial,
      id,
      loanUniqueId,
      productConfigSnapshot,
      activityLog: partial.activityLog ?? [
        { timestamp: now, event: 'Application submitted via public apply portal', actor: 'System' },
      ],
      appliedAt: now,
      updatedAt: now,
    };
    this._loans.update((all) => [record, ...all]);
    this.persist();
    return record;
  }

  update(id: string, patch: Partial<LoanApplication>) {
    this._loans.update((all) => all.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)));
    this.persist();
  }

  addActivity(id: string, event: string, actor = 'System') {
    const loan = this.getById(id);
    if (!loan) return;
    this.update(id, { activityLog: [...loan.activityLog, { timestamp: new Date().toISOString(), event, actor }] });
  }

  setStatus(id: string, status: LoanStatus, actor = 'System') {
    this.update(id, { status });
    this.addActivity(id, `Status updated to ${status.replace(/_/g, ' ')}`, actor);
    this.notifyCustomer(id, status);
  }
}
