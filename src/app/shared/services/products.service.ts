import { Injectable, signal } from '@angular/core';
import { idbGet, idbSet, WHOLE_COLLECTION_KEY } from '../utils/indexed-db';
import { DeliveryChannel } from './notification-delivery.service';

export type ProductStatus = 'live' | 'draft' | 'deactivated';
export type ProductKind = 'loan' | 'bnpl';

export interface ProductStats {
  totalApplications: number;
  approvalRate: number;
  avgLoanSize: string;
  activeLoans: number;
  totalDisbursed: string;
  collectionRate: number;
  nplRate: number;
}

export type ChannelStatus = 'connected' | 'pending' | 'not-configured';

/**
 * Lifecycle of a single deduction rail's integration, in the order a lender
 * moves through it: save credentials → test the connection → activate.
 * Only 'live' counts toward canActivate/publish gating below. 'needs_reverification'
 * is never persisted directly — it's what effectiveChannelStatus() computes for a
 * channel that's been 'live' longer than REVERIFICATION_PERIOD_DAYS since its last
 * successful testConnection call, and is treated as not-live for gating purposes
 * until a fresh test/activate cycle clears it.
 */
export type DeductionChannelStatus = 'not_configured' | 'credentials_saved' | 'test_passed' | 'live' | 'needs_reverification';

export interface DeductionChannelField {
  key: string;
  label: string;
}

/**
 * Canonical rail definitions — the single source of truth for what credential
 * fields each deduction channel needs. Both the create-loan wizard (when it
 * persists a selected channel) and product-detail's Integrations tab (when it
 * shows what's required to connect) read from this map, so a rail's field
 * list only ever needs to be defined once.
 */
export const DEDUCTION_CHANNEL_DEFS: Record<string, { name: string; fields: DeductionChannelField[] }> = {
  ippis: {
    name: 'IPPIS',
    fields: [{ key: 'username', label: 'Username' }, { key: 'password', label: 'Password' }, { key: 'agencyCode', label: 'Agency Code' }],
  },
  remita: {
    name: 'Remita',
    fields: [{ key: 'merchantId', label: 'Merchant ID' }, { key: 'apiKey', label: 'API Key' }, { key: 'serviceTypeId', label: 'Service Type ID' }, { key: 'apiToken', label: 'API Token' }],
  },
  dedukt: {
    name: 'Dedukt',
    fields: [{ key: 'apiKey', label: 'API Key' }],
  },
  wacs: {
    name: 'WACS',
    fields: [{ key: 'username', label: 'Username' }, { key: 'password', label: 'Password' }, { key: 'secretKey', label: 'Secret key' }],
  },
  'remita-direct-debit': {
    name: 'Remita Direct Debit',
    fields: [{ key: 'merchantId', label: 'Merchant ID' }, { key: 'apiKey', label: 'API Key' }, { key: 'mandateReference', label: 'Mandate Reference' }],
  },
  'mono-direct-debit': {
    name: 'Mono Direct Debit',
    fields: [{ key: 'secretKey', label: 'Secret key' }, { key: 'publicKey', label: 'Public key' }],
  },
};

export interface DeductionChannelConfig {
  id: string;
  name: string;
  enabled: boolean;
  status: DeductionChannelStatus;
  coverage: string;
  priority: number;
  /** Required credential fields for this rail — sourced from DEDUCTION_CHANNEL_DEFS. */
  fields: DeductionChannelField[];
  /** Saved credential values, keyed by field.key — set once by saveChannelCredentials(). */
  credentials?: Record<string, string>;
  /** ISO timestamp of the last successful testConnection() call — drives effectiveChannelStatus(). */
  lastVerifiedAt?: string;
}

export interface IncomeChannelConfig {
  id: string;
  label: string;
  desc: string;
  status: ChannelStatus;
}

export interface FeeConfig {
  enabled: boolean;
  method: string;
  value: string;
  applyTo: string;
  min: string;
  max: string;
}

export interface CustomFeeConfig {
  name: string;
  method: string;
  value: string;
  applyTo: string;
}

export interface LatePenaltyConfig {
  enabled: boolean;
  type: string;
  value: string;
  frequency: string;
  gracePeriod: string;
}

export type NotificationEventKey =
  | 'loan_application_submitted' | 'loan_document_approved' | 'loan_document_rejected'
  | 'loan_application_rejected'  | 'loan_application_cancelled' | 'loan_disbursed'
  | 'loan_repayment_reminder'    | 'loan_liquidation' | 'loan_completed';

/** Product-wide config for one loan-lifecycle notification — who gets told, on which
 * channels, when this event fires for a loan under this product. */
export interface NotificationEventConfig {
  key: NotificationEventKey;
  label: string;
  recipientCustomers: boolean;
  /** Ids into TeamsService.members(). */
  recipientTeamMemberIds: string[];
  channels: DeliveryChannel[];
  active: boolean;
  /** Only meaningful (and only editable) for the 'loan_repayment_reminder' event. */
  reminderTiming?: string;
  reminderFrequency?: string;
}

const NOTIFICATION_EVENT_LABELS: Record<NotificationEventKey, string> = {
  loan_application_submitted: 'Loan Application Submitted',
  loan_document_approved: 'Loan Document Approved',
  loan_document_rejected: 'Loan Document Rejected',
  loan_application_rejected: 'Loan Application Rejected',
  loan_application_cancelled: 'Loan Application Cancelled',
  loan_disbursed: 'Loan Disbursed',
  loan_repayment_reminder: 'Loan Repayment Reminder',
  loan_liquidation: 'Loan Liquidation',
  loan_completed: 'Loan Completed',
};

export const DEFAULT_NOTIFICATION_EVENTS: NotificationEventConfig[] = (
  Object.keys(NOTIFICATION_EVENT_LABELS) as NotificationEventKey[]
).map((key) => ({
  key,
  label: NOTIFICATION_EVENT_LABELS[key],
  recipientCustomers: false,
  recipientTeamMemberIds: [],
  channels: [],
  active: false,
}));

/**
 * Everything the create-loan wizard collects beyond the 11 headline fields
 * (name/type/amounts/tenor/interest — those stay directly on ProductRecord).
 * This is what buildProductPatch() in create-loan.component.ts should now
 * populate in full, and what product-detail.component.ts reads to render
 * every tab (Overview eligibility, Fees, Disbursement, Legal, Integrations).
 */
/** Always BVN today — kept as its own named field (rather than folded into a per-profile
 * income-verification source) because it's the identifier the cross-product exposure check
 * (LoansService.getCrossProductExposure) matches on regardless of which applicant profile
 * a borrower goes through. */
export type AccountIdentifierType = 'bvn';

export type CaptureMethod = 'upload' | 'in_app_recording';

export interface RequiredDocumentSpec {
  key: string;
  label: string;
  captureMethod: CaptureMethod;
}

/** Whether the repayment mandate is set up before ('inline') or after ('post_approval') the
 * eligibility-result bucket in the applicant-profile-driven /apply flow. */
export type MandateTiming = 'inline' | 'post_approval';

/** Recognized borrower-facing income-verification mechanisms an applicant profile can select —
 * each drives a distinct verification sub-flow in the profile-driven /apply engine. */
export type IncomeVerificationSource = 'remita' | 'wacs' | 'bank-statement' | 'business-revenue' | 'payslip';

/** The 4 fixed borrower audience categories the v2 /apply flow gates income-verification method
 * choice on. A profile's audience (if set) constrains which IncomeVerificationSource values are
 * offered — see AUDIENCE_INCOME_METHODS. Existing profiles with no audience set are treated as
 * legacy/unconstrained and keep using their single incomeVerificationSource unchanged. */
export type AudienceCategory =
  | 'public-civil-servant'
  | 'private-sector-worker'
  | 'sme-owner'
  | 'paramilitary'
  | 'correctional-services'
  | 'corper'
  | 'student';

/** Single source of truth for which income-verification methods each audience may choose between,
 * used both by the create-loan wizard (to constrain the picker per profile) and by the v2 /apply
 * flow's income-verification bucket (to render the choice UI). */
export const AUDIENCE_INCOME_METHODS: Record<AudienceCategory, IncomeVerificationSource[]> = {
  'public-civil-servant': ['remita', 'wacs'],
  'private-sector-worker': ['payslip', 'bank-statement'],
  'sme-owner': ['bank-statement'],
  'paramilitary': ['remita', 'wacs'],
  'correctional-services': ['remita', 'wacs'],
  'corper': ['remita'],
  'student': ['bank-statement'],
};

export const AUDIENCE_CATEGORY_LABELS: Record<AudienceCategory, string> = {
  'public-civil-servant': 'Public Servants',
  'private-sector-worker': 'Private Sector Workers',
  'sme-owner': 'SME Owners / Founders',
  'paramilitary': 'Paramilitary Workers',
  'correctional-services': 'Correctional Services',
  'corper': 'Corpers (NYSC)',
  'student': 'Students',
};

/** Field keys the profile-driven /apply flow's generic field renderer knows how to draw —
 * see apply-profile-flow/field-defs.ts for the label/input-type each maps to. */
export type ApplicantFieldKey =
  | 'fullName' | 'dateOfBirth' | 'gender'
  | 'employerName' | 'jobTitle' | 'staffId'
  | 'businessName' | 'businessCacNumber' | 'businessType' | 'businessAnnualRevenue' | 'businessRole'
  | 'monthlyIncome' | 'addressStreet' | 'addressCity' | 'addressState';

/**
 * A lender-configurable applicant type (e.g. "Government Employee" vs. "Business Owner") for
 * products using the new profile-driven /apply engine (apply-profile-flow.component.ts) instead
 * of the legacy per-loan-type flow. A product opts in purely by having a non-empty
 * ProductConfig.applicantProfiles — every existing product's array stays empty and keeps using
 * the legacy ApplyComponent flow unchanged.
 */
export interface ApplicantProfile {
  profileId: string;
  label: string;
  incomeVerificationSource: IncomeVerificationSource;
  /** Which of the 4 fixed borrower audiences this profile targets — gates the income-verification
   * method choice shown in the v2 /apply flow (see AUDIENCE_INCOME_METHODS). null means legacy/
   * unconstrained: the borrower flow falls back to incomeVerificationSource directly with no choice. */
  audience: AudienceCategory | null;
  fieldsRequired: ApplicantFieldKey[];
  requiredDocuments: RequiredDocumentSpec[];
  /** One of DEDUCTION_CHANNEL_DEFS's ids. */
  mandateRail: string;
  mandateTiming: MandateTiming;
}

export type EarlySettlementFeeType = 'none' | 'flat' | 'percentage_of_balance';
export type EarlySettlementInterestTreatment = 'waived' | 'still_owed_to_date';
export type WriteOffApproval = 'manual' | 'auto';

/**
 * How this product handles a loan being paid off before term (early settlement) or written off
 * as uncollectable. Set to sensible defaults at product creation (no wizard step for this — see
 * create-loan.component.ts's buildProductConfig()) and reviewed/edited afterward on the product
 * detail page's Liquidation tab. Captured into every loan's productConfigSnapshot at creation so
 * editing a product's policy later never changes the terms an existing loan was disbursed under.
 */
export interface LiquidationPolicy {
  earlySettlementAllowed: boolean;
  /** Months that must elapse since disbursement before early settlement is allowed. */
  earlySettlementMinTenorElapsed: number;
  earlySettlementFeeType: EarlySettlementFeeType;
  /** Naira amount if earlySettlementFeeType is 'flat', or a percentage (0-100) if 'percentage_of_balance'. */
  earlySettlementFeeValue: number;
  earlySettlementInterestTreatment: EarlySettlementInterestTreatment;
  /** Days past due before a loan becomes eligible for write-off. */
  writeOffThresholdDays: number;
  writeOffApprovalRequired: WriteOffApproval;
  partialLiquidationAllowed: boolean;
}

export const DEFAULT_LIQUIDATION_POLICY: LiquidationPolicy = {
  earlySettlementAllowed: true,
  earlySettlementMinTenorElapsed: 0,
  earlySettlementFeeType: 'none',
  earlySettlementFeeValue: 0,
  earlySettlementInterestTreatment: 'waived',
  writeOffThresholdDays: 90,
  writeOffApprovalRequired: 'manual',
  partialLiquidationAllowed: false,
};

export interface ProductConfig {
  minInterest: string;
  maxInterest: string;
  eligibility: string[];
  activeLoanPolicy: string;
  kycDocs: string[];
  processingFee: FeeConfig;
  customFees: CustomFeeConfig[];
  offerLetter: string;
  disburseToSalary: string;
  autoDeductions: string;
  videoConfirmation: string;
  incomeChannels: IncomeChannelConfig[];
  deductionChannels: DeductionChannelConfig[];
  repaymentFrequency: string;
  minRepayments: string;
  maxRepayments: string;
  firstPaymentOffset: string;
  repaymentOrder: string[];
  activateImmediately: boolean;
  latePenalty: LatePenaltyConfig;
  policyText: string;
  notificationEvents: NotificationEventConfig[];
  accountIdentifier: AccountIdentifierType;
  applicantProfiles: ApplicantProfile[];
  liquidationPolicy: LiquidationPolicy;
}

export const DEFAULT_PRODUCT_CONFIG: ProductConfig = {
  minInterest: '0',
  maxInterest: '0',
  eligibility: [],
  activeLoanPolicy: 'Restricted — borrowers must repay their active loan before reapplying.',
  kycDocs: [],
  processingFee: { enabled: false, method: 'Percentage', value: '0%', applyTo: 'Loan Amount', min: '₦0', max: '₦0' },
  customFees: [],
  offerLetter: 'Not required',
  disburseToSalary: 'No',
  autoDeductions: 'No',
  videoConfirmation: 'No',
  incomeChannels: [],
  deductionChannels: [],
  repaymentFrequency: 'Monthly',
  minRepayments: '1',
  maxRepayments: '12',
  firstPaymentOffset: '30 days after disbursement',
  repaymentOrder: ['Fees', 'Interest', 'Penalty', 'Principal'],
  activateImmediately: true,
  latePenalty: { enabled: false, type: 'Percentage', value: '0%', frequency: 'Daily', gracePeriod: '0 days' },
  policyText: '',
  notificationEvents: DEFAULT_NOTIFICATION_EVENTS,
  accountIdentifier: 'bvn',
  applicantProfiles: [],
  liquidationPolicy: DEFAULT_LIQUIDATION_POLICY,
};

export interface ProductRecord {
  id: string;
  name: string;
  type: ProductKind;
  status: ProductStatus;
  createdAt: string;
  description: string;
  minAmount: string;
  maxAmount: string;
  minTenor: string;
  maxTenor: string;
  tenorUnit: string;
  interestRate: string;
  interestType: string;
  interestFrequency: string;
  websiteLink: string;
  /** Data URL of the banner image uploaded in the wizard's Customise step — shown on both product-detail's hero and the borrower portal. */
  bannerImageDataUrl?: string;
  stats: ProductStats;
  config: ProductConfig;
  /**
   * Raw snapshot of the create-loan wizard's own form state (LoanConfig, kept as
   * an untyped record here to avoid a circular import with the wizard component).
   * `config` above is a derived, lossy projection built for display/preview — it
   * collapses booleans into label lists and drops fields like late-penalty max-cap
   * settings, disbursement timing, legal text, and branding entirely. Re-opening
   * the wizard to edit needs the lossless original, so this is captured on every
   * save and used to prefill the form instead of trying to reverse the projection.
   * Optional because products seeded outside the wizard (e.g. demo data) won't have it.
   */
  wizardConfig?: Record<string, unknown>;
  /** Onboarded vendors for BNPL products. Populated from product-detail's vendor management tab. */
  vendors?: { id: string; businessName: string; category: string; slug: string }[];
}

/** Days a 'live' channel is trusted after its last successful testConnection() before it needs re-verification. */
export const REVERIFICATION_PERIOD_DAYS = 30;

/**
 * A 'live' channel doesn't stay trusted forever — if it's been longer than
 * REVERIFICATION_PERIOD_DAYS since its last successful test, treat it as
 * 'needs_reverification' (not live) for gating/display, even though the
 * persisted status field still says 'live'. Every other status passes through.
 */
export function effectiveChannelStatus(channel: DeductionChannelConfig, now: Date = new Date()): DeductionChannelStatus {
  if (channel.status !== 'live') return channel.status;
  if (!channel.lastVerifiedAt) return 'needs_reverification';
  const ageDays = (now.getTime() - new Date(channel.lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24);
  return ageDays >= REVERIFICATION_PERIOD_DAYS ? 'needs_reverification' : 'live';
}

function channelStatusBlockReason(status: DeductionChannelStatus): string {
  switch (status) {
    case 'not_configured': return 'needs credentials before it can go live';
    case 'credentials_saved': return 'pending test connection';
    case 'test_passed': return 'passed testing — activate it to go live';
    case 'needs_reverification': return `hasn't been re-verified in over ${REVERIFICATION_PERIOD_DAYS} days — re-test and reactivate it`;
    default: return 'is not ready';
  }
}

/** True only when every enabled deduction channel has reached (and still holds) 'live'. Gates publish(). */
export function computeCanActivate(config: ProductConfig, now: Date = new Date()): boolean {
  const enabled = config.deductionChannels.filter((c) => c.enabled);
  return enabled.length > 0 && enabled.every((c) => effectiveChannelStatus(c, now) === 'live');
}

/** Human-readable reason publish() would be blocked, or null if it wouldn't be. */
export function publishBlockReason(config: ProductConfig, now: Date = new Date()): string | null {
  if (computeCanActivate(config, now)) return null;
  const enabled = config.deductionChannels.filter((c) => c.enabled);
  if (!enabled.length) return 'Enable at least one deduction channel before publishing.';
  const blocker = enabled.find((c) => effectiveChannelStatus(c, now) !== 'live')!;
  return `${blocker.name} integration ${channelStatusBlockReason(effectiveChannelStatus(blocker, now))}.`;
}

const STORAGE_KEY = 'caltos_products';

const DEFAULT_STATS: ProductStats = {
  totalApplications: 0, approvalRate: 0, avgLoanSize: '₦0', activeLoans: 0,
  totalDisbursed: '₦0', collectionRate: 0, nplRate: 0,
};

/** Sample data for a "Load demo data" action — never auto-seeded, so a fresh browser starts empty. */
export function demoProducts(): ProductRecord[] {
  const corperWalletConfig: ProductConfig = {
    minInterest: '500',
    maxInterest: '5,000',
    eligibility: ['Remita', 'IPPIS', 'Salary Earner'],
    activeLoanPolicy: 'Restricted — borrowers must repay their active loan before reapplying.',
    kycDocs: ['National ID (NIN)', 'Utility Bill', 'Last 3 months payslip', 'Bank statement (6 months)'],
    processingFee: { enabled: true, method: 'Percentage', value: '1.5%', applyTo: 'Loan Amount', min: '₦750', max: '₦1,550' },
    customFees: [{ name: 'Admin Fee', method: 'Flat Fee', value: '₦2,500', applyTo: 'Per Loan' }],
    offerLetter: 'Digital signature required',
    disburseToSalary: 'Yes',
    autoDeductions: 'No',
    videoConfirmation: 'No',
    incomeChannels: [
      { id: 'remita', label: 'Remita', desc: 'Salary verification via Remita', status: 'connected' },
      { id: 'ippis', label: 'IPPIS', desc: 'Federal payroll verification', status: 'pending' },
      { id: 'bank', label: 'Bank Statement', desc: 'Automated bank statement analysis', status: 'connected' },
    ],
    deductionChannels: [
      { id: 'ippis', name: 'IPPIS', enabled: true, status: 'test_passed', coverage: 'Federal MDAs only', priority: 1, fields: DEDUCTION_CHANNEL_DEFS['ippis'].fields, credentials: { username: 'princeps-ops', password: '••••••••', agencyCode: 'FMH-001' } },
      { id: 'remita', name: 'Remita', enabled: true, status: 'live', coverage: 'Federal + some states', priority: 2, fields: DEDUCTION_CHANNEL_DEFS['remita'].fields, credentials: { merchantId: 'RM-2291', apiKey: '••••••••', serviceTypeId: '4430731', apiToken: '••••••••' }, lastVerifiedAt: '2026-07-01T09:00:00.000Z' },
      { id: 'remita-direct-debit', name: 'Direct Debit', enabled: true, status: 'not_configured', coverage: 'Any bank', priority: 3, fields: DEDUCTION_CHANNEL_DEFS['remita-direct-debit'].fields },
    ],
    repaymentFrequency: 'Monthly',
    minRepayments: '3',
    maxRepayments: '9',
    firstPaymentOffset: '30 days after disbursement',
    repaymentOrder: ['Fees', 'Interest', 'Penalty', 'Principal'],
    activateImmediately: true,
    latePenalty: { enabled: true, type: 'Percentage', value: '2%', frequency: 'Daily', gracePeriod: '3 days' },
    policyText: 'By applying, you agree that Princeps Finance may verify your employment, salary, and credit history from third-party sources to assess your eligibility. If approved, your monthly repayments will be automatically deducted from your salary before funds are credited to your account. Any outstanding balance in the event of default may be recovered from your other linked accounts.\n\nBy checking this box, you confirm that you have read and accept our Privacy Policy and Loan Terms & Conditions.',
    notificationEvents: DEFAULT_NOTIFICATION_EVENTS,
    accountIdentifier: 'bvn',
    applicantProfiles: [],
    liquidationPolicy: DEFAULT_LIQUIDATION_POLICY,
  };

  const bnplConfig: ProductConfig = {
    minInterest: '500',
    maxInterest: '10,000',
    eligibility: ['BVN', 'Phone OTP'],
    activeLoanPolicy: 'Allowed — borrowers may have multiple active BNPL plans.',
    kycDocs: ['Government Issued ID (Required)', 'Utility Bill (Optional)'],
    processingFee: { enabled: true, method: 'Percentage', value: '1.5%', applyTo: 'Purchase Amount', min: '₦500', max: '₦5,000' },
    customFees: [],
    offerLetter: 'Not required',
    disburseToSalary: 'No — funds go to vendor settlement account',
    autoDeductions: 'No',
    videoConfirmation: 'No',
    incomeChannels: [{ id: 'bank', label: 'Bank Statement', desc: 'Automated bank statement analysis', status: 'connected' }],
    deductionChannels: [
      { id: 'mono-direct-debit', name: 'Direct Debit', enabled: true, status: 'live', coverage: 'Any bank', priority: 1, fields: DEDUCTION_CHANNEL_DEFS['mono-direct-debit'].fields, credentials: { secretKey: '••••••••', publicKey: 'pk_live_mono_qb001' }, lastVerifiedAt: '2026-07-01T09:00:00.000Z' },
    ],
    repaymentFrequency: 'Monthly',
    minRepayments: '1',
    maxRepayments: '12',
    firstPaymentOffset: '30 days after purchase',
    repaymentOrder: ['Fees', 'Interest', 'Penalty', 'Principal'],
    activateImmediately: true,
    latePenalty: { enabled: true, type: 'Percentage', value: '1.5%', frequency: 'Daily', gracePeriod: '3 days' },
    policyText: 'By proceeding with this purchase, you agree that Princeps Finance will finance this transaction on your behalf. Repayment will be made in equal monthly instalments as agreed. Failure to repay may result in reporting to credit bureaus and recovery action.\n\nBy checking this box, you confirm that you have read and accept our Privacy Policy and BNPL Terms & Conditions.',
    notificationEvents: DEFAULT_NOTIFICATION_EVENTS,
    accountIdentifier: 'bvn',
    applicantProfiles: [],
    liquidationPolicy: DEFAULT_LIQUIDATION_POLICY,
  };

  return [
    {
      id: 'CW001', name: 'Corper Wallet', type: 'loan', status: 'live',
      createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
      description: 'Short-term cash advance for active NYSC corps members.',
      minAmount: '30,000', maxAmount: '100,000', minTenor: '3', maxTenor: '9', tenorUnit: 'Months',
      interestRate: '7.5', interestType: 'Flat Rate', interestFrequency: 'Monthly',
      websiteLink: 'apply.caltos.co/princeps/corper-wallet',
      stats: { totalApplications: 412, approvalRate: 77, avgLoanSize: '₦64,200', activeLoans: 128, totalDisbursed: '₦18,400,000', collectionRate: 94.2, nplRate: 3.1 },
      config: corperWalletConfig,
    },
    {
      id: 'CRI02', name: 'Credit Wallet', type: 'loan', status: 'live',
      createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
      description: 'Flexible short-term credit line for salary earners.',
      minAmount: '30,000', maxAmount: '100,000', minTenor: '6', maxTenor: '12', tenorUnit: 'Months',
      interestRate: '7.5', interestType: 'Flat Rate', interestFrequency: 'Monthly',
      websiteLink: 'apply.caltos.co/princeps/credit-wallet',
      stats: { totalApplications: 298, approvalRate: 71, avgLoanSize: '₦58,900', activeLoans: 94, totalDisbursed: '₦12,100,000', collectionRate: 91.6, nplRate: 4.4 },
      config: corperWalletConfig,
    },
    {
      id: 'CA100', name: 'Credit Alert', type: 'loan', status: 'live',
      createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
      description: 'Longer-tenor credit facility with daily interest accrual.',
      minAmount: '30,000', maxAmount: '100,000', minTenor: '12', maxTenor: '24', tenorUnit: 'Months',
      interestRate: '7.5', interestType: 'Flat Rate', interestFrequency: 'Daily',
      websiteLink: 'apply.caltos.co/princeps/credit-alert',
      stats: { totalApplications: 156, approvalRate: 68, avgLoanSize: '₦71,300', activeLoans: 52, totalDisbursed: '₦6,900,000', collectionRate: 89.1, nplRate: 5.7 },
      config: corperWalletConfig,
    },
    {
      id: 'WCR03', name: 'WACS', type: 'loan', status: 'deactivated',
      createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
      description: 'Legacy long-tenor product, no longer accepting applications.',
      minAmount: '30,000', maxAmount: '100,000', minTenor: '24', maxTenor: '52', tenorUnit: 'Months',
      interestRate: '7.5', interestType: 'Flat Rate', interestFrequency: 'Monthly',
      websiteLink: 'apply.caltos.co/princeps/wacs',
      stats: { totalApplications: 61, approvalRate: 54, avgLoanSize: '₦45,000', activeLoans: 8, totalDisbursed: '₦1,200,000', collectionRate: 82.3, nplRate: 9.8 },
      config: {
        ...corperWalletConfig,
        deductionChannels: [
          { id: 'wacs', name: 'WACS', enabled: true, status: 'credentials_saved', coverage: 'State MDAs on the WACS platform', priority: 1, fields: DEDUCTION_CHANNEL_DEFS['wacs'].fields, credentials: { username: 'princeps-wacs', password: '••••••••', secretKey: '••••••••' } },
        ],
      },
    },
    {
      id: 'QB001', name: 'Quick Buy BNPL', type: 'bnpl', status: 'live',
      createdAt: 'Jun 12, 2025, 10:14:22 AM GMT',
      description: 'Instant purchase financing for goods and services.',
      minAmount: '20,000', maxAmount: '500,000', minTenor: '1', maxTenor: '12', tenorUnit: 'Months',
      interestRate: '5.0', interestType: 'Flat Rate', interestFrequency: 'Monthly',
      websiteLink: 'apply.caltos.co/princeps/bnpl/quick-buy',
      stats: { totalApplications: 203, approvalRate: 82, avgLoanSize: '₦96,400', activeLoans: 71, totalDisbursed: '₦9,300,000', collectionRate: 96.0, nplRate: 2.2 },
      config: bnplConfig,
    },
    {
      id: 'SFL04', name: 'School Fees Advance', type: 'loan', status: 'draft',
      createdAt: 'Jul 01, 2026, 9:10:00 AM GMT',
      description: 'Draft product — help parents pay school fees in instalments. Not yet published.',
      minAmount: '20,000', maxAmount: '250,000', minTenor: '3', maxTenor: '6', tenorUnit: 'Months',
      interestRate: '6.0', interestType: 'Flat Rate', interestFrequency: 'Monthly',
      websiteLink: '',
      stats: DEFAULT_STATS,
      config: DEFAULT_PRODUCT_CONFIG,
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  // IndexedDB reads are async, so this starts empty and is populated moments after
  // construction once loadFromIndexedDb() resolves — see the constructor below.
  private readonly _products = signal<ProductRecord[]>([]);
  readonly products = this._products.asReadonly();

  /**
   * Set whenever the last persist() call failed. IndexedDB's per-origin quota is hundreds of
   * MB to low GB (vs localStorage's ~5-10MB), so this should now be rare even with inline
   * base64 banner images/wizard snapshots — but callers still shouldn't fail silently.
   */
  readonly persistError = signal<string | null>(null);

  /**
   * Resolves once the initial IndexedDB read completes. IndexedDB is async even for the very
   * first read, unlike the old synchronous localStorage.getItem — so any code that reads
   * getById()/products() right after this service is constructed (e.g. a route component's
   * ngOnInit firing before this resolves) should `await` this first, or it may see an empty
   * list for a real product that just hasn't loaded yet.
   */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.loadFromIndexedDb();
  }

  private async loadFromIndexedDb() {
    try {
      let records = await idbGet<ProductRecord[]>('products', WHOLE_COLLECTION_KEY);
      if (records === undefined) {
        // First run after the IndexedDB migration — a prior session may still have real data
        // sitting in the old localStorage key. Import it once so it isn't silently lost.
        records = this.loadLegacyLocalStorage();
        if (records.length) {
          await idbSet('products', WHOLE_COLLECTION_KEY, records);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      // Backfill config (and its individual fields, for configs saved before they existed).
      this._products.set(records.map((p) => {
        const config = p.config ?? DEFAULT_PRODUCT_CONFIG;
        return {
          ...p,
          config: {
            ...config,
            accountIdentifier: config.accountIdentifier ?? 'bvn',
            applicantProfiles: config.applicantProfiles ?? [],
            liquidationPolicy: config.liquidationPolicy ?? DEFAULT_LIQUIDATION_POLICY,
          },
        };
      }));
    } catch (e) {
      console.error('Failed to load products from IndexedDB', e);
    }
  }

  private loadLegacyLocalStorage(): ProductRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ProductRecord[];
    } catch {}
    return [];
  }

  private async persist() {
    try {
      await idbSet('products', WHOLE_COLLECTION_KEY, this._products());
      this.persistError.set(null);
    } catch (e) {
      // Don't rethrow — callers (create/update/publish/saveDraft) are synchronous and an
      // uncaught error here would abort them partway through, silently skipping everything
      // after the persist() call (e.g. setting editingProductId, showing the success modal).
      // In-memory state (the signal) is already updated, so the current session keeps working;
      // we just can't survive a reload. Surface it via persistError instead.
      console.error('Failed to persist products to IndexedDB', e);
      this.persistError.set('This change could not be saved permanently — your browser storage may be full or unavailable in this tab (e.g. private/incognito mode).');
    }
  }

  /** Replaces everything with the sample product set — an explicit, opt-in action (see product-list's empty state). */
  loadDemoData() {
    this._products.set(demoProducts());
    this.persist();
  }

  getById(id: string): ProductRecord | undefined {
    return this._products().find((p) => p.id === id);
  }

  /**
   * The wizard's own lossless snapshot of what a product looked like when last published —
   * this is what the borrower portal (/apply) renders. Kept generic (not typed to the
   * wizard's LoanConfig) to avoid a shared→feature import; callers cast as needed.
   * Keyed by product id, one row per product (not the whole-collection-in-one-record
   * pattern the products/loans stores use) since it's read/written per-id, never as a list.
   */
  async getPublishedConfig(id: string): Promise<Record<string, unknown> | undefined> {
    try {
      const fromDb = await idbGet<Record<string, unknown>>('published_configs', id);
      if (fromDb !== undefined) return fromDb;
      // One-time legacy import, same idea as loadLegacyLocalStorage() above.
      const raw = localStorage.getItem(`caltos_published_config_${id}`);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      await idbSet('published_configs', id, parsed);
      localStorage.removeItem(`caltos_published_config_${id}`);
      return parsed;
    } catch (e) {
      console.error('Failed to load published config from IndexedDB', e);
      return undefined;
    }
  }

  async setPublishedConfig(id: string, config: Record<string, unknown>): Promise<void> {
    await idbSet('published_configs', id, config);
  }

  create(partial: Partial<ProductRecord> & { name: string }): ProductRecord {
    const record: ProductRecord = {
      id: partial.id ?? 'PR' + Date.now().toString(36).toUpperCase(),
      name: partial.name,
      type: partial.type ?? 'loan',
      status: partial.status ?? 'draft',
      createdAt: partial.createdAt ?? new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      description: partial.description ?? '',
      minAmount: partial.minAmount ?? '0',
      maxAmount: partial.maxAmount ?? '0',
      minTenor: partial.minTenor ?? '1',
      maxTenor: partial.maxTenor ?? '12',
      tenorUnit: partial.tenorUnit ?? 'Months',
      interestRate: partial.interestRate ?? '0',
      interestType: partial.interestType ?? 'Flat Rate',
      interestFrequency: partial.interestFrequency ?? 'Monthly',
      websiteLink: partial.websiteLink ?? '',
      bannerImageDataUrl: partial.bannerImageDataUrl,
      stats: partial.stats ?? DEFAULT_STATS,
      config: partial.config ?? DEFAULT_PRODUCT_CONFIG,
      wizardConfig: partial.wizardConfig,
    };
    this._products.update((list) => [...list, record]);
    this.persist();
    return record;
  }

  update(id: string, patch: Partial<ProductRecord>) {
    this._products.update((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    this.persist();
  }

  setStatus(id: string, status: ProductStatus) {
    this.update(id, { status });
  }

  duplicate(id: string): ProductRecord | undefined {
    const source = this.getById(id);
    if (!source) return undefined;
    return this.create({
      ...source,
      id: undefined,
      name: `${source.name} (Copy)`,
      status: 'draft',
      stats: DEFAULT_STATS,
      config: {
        ...source.config,
        // A copy must earn its own 'live' channels — credentials belong to the original
        // integration account and a status of 'live'/'test_passed' would otherwise let the
        // new draft claim canActivate without ever running its own save-credentials/test cycle.
        deductionChannels: source.config.deductionChannels.map((c) => ({
          id: c.id,
          name: c.name,
          enabled: c.enabled,
          status: 'not_configured',
          coverage: c.coverage,
          priority: c.priority,
          fields: c.fields,
        })),
      },
    });
  }

  remove(id: string) {
    this._products.update((list) => list.filter((p) => p.id !== id));
    this.persist();
  }

  /** True only when every enabled deduction channel on this product is 'live'. */
  canActivate(id: string): boolean {
    const record = this.getById(id);
    return !!record && computeCanActivate(record.config);
  }

  /** Reason publish() would currently be blocked for this product, or null if it wouldn't be. */
  getPublishBlockReason(id: string): string | null {
    const record = this.getById(id);
    return record ? publishBlockReason(record.config) : null;
  }

  /** Sets the product live, but only if canActivate — a product cannot publish while any enabled channel is below 'live'. */
  publish(id: string): { success: boolean; reason?: string } {
    const record = this.getById(id);
    if (!record) return { success: false, reason: 'Product not found.' };
    const reason = publishBlockReason(record.config);
    if (reason) return { success: false, reason };
    this.setStatus(id, 'live');
    return { success: true };
  }

  private updateChannel(productId: string, channelId: string, fn: (c: DeductionChannelConfig) => DeductionChannelConfig) {
    this._products.update((list) => list.map((p) => (p.id !== productId ? p : {
      ...p,
      config: {
        ...p.config,
        deductionChannels: p.config.deductionChannels.map((c) => (c.id === channelId ? fn(c) : c)),
      },
    })));
    this.persist();
  }

  saveChannelCredentials(productId: string, channelId: string, credentials: Record<string, string>) {
    this.updateChannel(productId, channelId, (c) => ({ ...c, credentials, status: 'credentials_saved' }));
  }

  /**
   * Simulates pinging the rail's endpoint with its saved credentials — there's no real backend
   * here, so failure is driven by a "fail"/"invalid" marker in a credential value rather than
   * chance, letting testers deliberately exercise the failure path on demand.
   */
  async testConnection(productId: string, channelId: string): Promise<{ success: boolean; message: string }> {
    const record = this.getById(productId);
    const channel = record?.config.deductionChannels.find((c) => c.id === channelId);
    if (!channel) return { success: false, message: 'Channel not found.' };
    if (channel.status === 'not_configured') {
      return { success: false, message: `Save ${channel.name} credentials before testing the connection.` };
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const values = Object.values(channel.credentials ?? {});
    const success = !values.some((v) => /fail|invalid/i.test(v));
    this.updateChannel(productId, channelId, (c) => ({
      ...c,
      status: success ? 'test_passed' : 'credentials_saved',
      lastVerifiedAt: success ? new Date().toISOString() : c.lastVerifiedAt,
    }));
    return {
      success,
      message: success
        ? `${channel.name} connection verified.`
        : `${channel.name} rejected the saved credentials — check them and try again.`,
    };
  }

  /** Promotes a rail to 'live', but only once it has actually passed a connection test. */
  activateChannel(productId: string, channelId: string): boolean {
    const record = this.getById(productId);
    const channel = record?.config.deductionChannels.find((c) => c.id === channelId);
    if (!channel || channel.status !== 'test_passed') return false;
    this.updateChannel(productId, channelId, (c) => ({ ...c, status: 'live' }));
    return true;
  }
}
