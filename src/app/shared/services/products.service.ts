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
}

const STORAGE_KEY = 'caltos_products';

const DEFAULT_STATS: ProductStats = {
  totalApplications: 0, approvalRate: 0, avgLoanSize: '₦0', activeLoans: 0,
  totalDisbursed: '₦0', collectionRate: 0, nplRate: 0,
};

function seedProducts(): ProductRecord[] {
  return [
    {
      id: 'CW001', name: 'Corper Wallet', type: 'loan', status: 'live',
      createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
      description: 'Short-term cash advance for active NYSC corps members.',
      minAmount: '30,000', maxAmount: '100,000', minTenor: '3', maxTenor: '9', tenorUnit: 'Months',
      interestRate: '7.5', interestType: 'Flat Rate', interestFrequency: 'Monthly',
      websiteLink: 'apply.caltos.co/princeps/corper-wallet',
      stats: { totalApplications: 412, approvalRate: 77, avgLoanSize: '₦64,200', activeLoans: 128, totalDisbursed: '₦18,400,000', collectionRate: 94.2, nplRate: 3.1 },
    },
    {
      id: 'CRI02', name: 'Credit Wallet', type: 'loan', status: 'live',
      createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
      description: 'Flexible short-term credit line for salary earners.',
      minAmount: '30,000', maxAmount: '100,000', minTenor: '6', maxTenor: '12', tenorUnit: 'Months',
      interestRate: '7.5', interestType: 'Flat Rate', interestFrequency: 'Monthly',
      websiteLink: 'apply.caltos.co/princeps/credit-wallet',
      stats: { totalApplications: 298, approvalRate: 71, avgLoanSize: '₦58,900', activeLoans: 94, totalDisbursed: '₦12,100,000', collectionRate: 91.6, nplRate: 4.4 },
    },
    {
      id: 'CA100', name: 'Credit Alert', type: 'loan', status: 'live',
      createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
      description: 'Longer-tenor credit facility with daily interest accrual.',
      minAmount: '30,000', maxAmount: '100,000', minTenor: '12', maxTenor: '24', tenorUnit: 'Months',
      interestRate: '7.5', interestType: 'Flat Rate', interestFrequency: 'Daily',
      websiteLink: 'apply.caltos.co/princeps/credit-alert',
      stats: { totalApplications: 156, approvalRate: 68, avgLoanSize: '₦71,300', activeLoans: 52, totalDisbursed: '₦6,900,000', collectionRate: 89.1, nplRate: 5.7 },
    },
    {
      id: 'WCR03', name: 'WACS', type: 'loan', status: 'deactivated',
      createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
      description: 'Legacy long-tenor product, no longer accepting applications.',
      minAmount: '30,000', maxAmount: '100,000', minTenor: '24', maxTenor: '52', tenorUnit: 'Months',
      interestRate: '7.5', interestType: 'Flat Rate', interestFrequency: 'Monthly',
      websiteLink: 'apply.caltos.co/princeps/wacs',
      stats: { totalApplications: 61, approvalRate: 54, avgLoanSize: '₦45,000', activeLoans: 8, totalDisbursed: '₦1,200,000', collectionRate: 82.3, nplRate: 9.8 },
    },
    {
      id: 'QB001', name: 'Quick Buy BNPL', type: 'bnpl', status: 'live',
      createdAt: 'Jun 12, 2025, 10:14:22 AM GMT',
      description: 'Instant purchase financing for goods and services.',
      minAmount: '20,000', maxAmount: '500,000', minTenor: '1', maxTenor: '12', tenorUnit: 'Months',
      interestRate: '5.0', interestType: 'Flat Rate', interestFrequency: 'Monthly',
      websiteLink: 'apply.caltos.co/princeps/bnpl/quick-buy',
      stats: { totalApplications: 203, approvalRate: 82, avgLoanSize: '₦96,400', activeLoans: 71, totalDisbursed: '₦9,300,000', collectionRate: 96.0, nplRate: 2.2 },
    },
    {
      id: 'SFL04', name: 'School Fees Advance', type: 'loan', status: 'draft',
      createdAt: 'Jul 01, 2026, 9:10:00 AM GMT',
      description: 'Draft product — help parents pay school fees in instalments. Not yet published.',
      minAmount: '20,000', maxAmount: '250,000', minTenor: '3', maxTenor: '6', tenorUnit: 'Months',
      interestRate: '6.0', interestType: 'Flat Rate', interestFrequency: 'Monthly',
      websiteLink: '',
      stats: DEFAULT_STATS,
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
      if (raw) return JSON.parse(raw);
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
