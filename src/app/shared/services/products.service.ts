import { Injectable, signal } from '@angular/core';

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
  status: ChannelStatus;
  coverage: string;
  priority: number;
  /** Required credential fields for this rail — sourced from DEDUCTION_CHANNEL_DEFS. */
  fields: DeductionChannelField[];
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

/**
 * Everything the create-loan wizard collects beyond the 11 headline fields
 * (name/type/amounts/tenor/interest — those stay directly on ProductRecord).
 * This is what buildProductPatch() in create-loan.component.ts should now
 * populate in full, and what product-detail.component.ts reads to render
 * every tab (Overview eligibility, Fees, Disbursement, Legal, Integrations).
 */
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
  stats: ProductStats;
  config: ProductConfig;
}

const STORAGE_KEY = 'caltos_products';

const DEFAULT_STATS: ProductStats = {
  totalApplications: 0, approvalRate: 0, avgLoanSize: '₦0', activeLoans: 0,
  totalDisbursed: '₦0', collectionRate: 0, nplRate: 0,
};

function seedProducts(): ProductRecord[] {
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
      { id: 'ippis', name: 'IPPIS', enabled: true, status: 'pending', coverage: 'Federal MDAs only', priority: 1, fields: DEDUCTION_CHANNEL_DEFS['ippis'].fields },
      { id: 'remita', name: 'Remita', enabled: true, status: 'connected', coverage: 'Federal + some states', priority: 2, fields: DEDUCTION_CHANNEL_DEFS['remita'].fields },
      { id: 'remita-direct-debit', name: 'Direct Debit', enabled: true, status: 'not-configured', coverage: 'Any bank', priority: 3, fields: DEDUCTION_CHANNEL_DEFS['remita-direct-debit'].fields },
    ],
    repaymentFrequency: 'Monthly',
    minRepayments: '3',
    maxRepayments: '9',
    firstPaymentOffset: '30 days after disbursement',
    repaymentOrder: ['Fees', 'Interest', 'Penalty', 'Principal'],
    activateImmediately: true,
    latePenalty: { enabled: true, type: 'Percentage', value: '2%', frequency: 'Daily', gracePeriod: '3 days' },
    policyText: 'By applying, you agree that Princeps Finance may verify your employment, salary, and credit history from third-party sources to assess your eligibility. If approved, your monthly repayments will be automatically deducted from your salary before funds are credited to your account. Any outstanding balance in the event of default may be recovered from your other linked accounts.\n\nBy checking this box, you confirm that you have read and accept our Privacy Policy and Loan Terms & Conditions.',
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
      { id: 'mono-direct-debit', name: 'Direct Debit', enabled: true, status: 'connected', coverage: 'Any bank', priority: 1, fields: DEDUCTION_CHANNEL_DEFS['mono-direct-debit'].fields },
    ],
    repaymentFrequency: 'Monthly',
    minRepayments: '1',
    maxRepayments: '12',
    firstPaymentOffset: '30 days after purchase',
    repaymentOrder: ['Fees', 'Interest', 'Penalty', 'Principal'],
    activateImmediately: true,
    latePenalty: { enabled: true, type: 'Percentage', value: '1.5%', frequency: 'Daily', gracePeriod: '3 days' },
    policyText: 'By proceeding with this purchase, you agree that Princeps Finance will finance this transaction on your behalf. Repayment will be made in equal monthly instalments as agreed. Failure to repay may result in reporting to credit bureaus and recovery action.\n\nBy checking this box, you confirm that you have read and accept our Privacy Policy and BNPL Terms & Conditions.',
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
          { id: 'wacs', name: 'WACS', enabled: true, status: 'connected', coverage: 'State MDAs on the WACS platform', priority: 1, fields: DEDUCTION_CHANNEL_DEFS['wacs'].fields },
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
  private readonly _products = signal<ProductRecord[]>(this.load());
  readonly products = this._products.asReadonly();

  private load(): ProductRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProductRecord[];
        // Backfill config for records saved before this field existed.
        return parsed.map((p) => ({ ...p, config: p.config ?? DEFAULT_PRODUCT_CONFIG }));
      }
    } catch {}
    return seedProducts();
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._products()));
  }

  getById(id: string): ProductRecord | undefined {
    return this._products().find((p) => p.id === id);
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
      stats: partial.stats ?? DEFAULT_STATS,
      config: partial.config ?? DEFAULT_PRODUCT_CONFIG,
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
    });
  }

  remove(id: string) {
    this._products.update((list) => list.filter((p) => p.id !== id));
    this.persist();
  }
}
