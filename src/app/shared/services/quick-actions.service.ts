import { Injectable, computed, signal } from '@angular/core';

export type QuickActionCategory = 'Loan Actions' | 'Customer Actions' | 'Product Actions' | 'Reports' | 'Wallet';

export type QuickActionIconColor = 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'gray' | 'red';

export type QuickActionIcon =
  | 'disburse' | 'lookup' | 'repayment' | 'approvals' | 'flag' | 'restructure'
  | 'add-customer' | 'kyc' | 'link-account'
  | 'product' | 'performance'
  | 'report' | 'schedule' | 'overdue'
  | 'wallet' | 'statement';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  category: QuickActionCategory;
  route: string;
  icon: QuickActionIcon;
  iconColor: QuickActionIconColor;
  shortcut?: string;
  /** When set, resolves to a live badge count (e.g. pending approvals). */
  badgeCount?: () => number;
}

const RECENT_STORAGE_KEY = 'caltos_recent_actions';
const MAX_RECENT = 5;

@Injectable({ providedIn: 'root' })
export class QuickActionsService {
  // Mocked live count — the pending-approvals data currently lives only inside
  // LoanProcessingComponent's local state, not a shared service, so this mirrors
  // the number of applications awaiting approval in that page's seed data.
  private readonly _pendingApprovalsCount = signal(3);
  readonly pendingApprovalsCount = this._pendingApprovalsCount.asReadonly();

  readonly actions: QuickAction[] = [
    // Loan Actions
    { id: 'disburse-loan', title: 'Disburse new loan', description: 'Review and release funds to an approved loan application.', category: 'Loan Actions', route: '/loans/processing', icon: 'disburse', iconColor: 'orange' },
    { id: 'lookup-customer', title: 'Look up customer', description: 'Search and open a customer profile.', category: 'Loan Actions', route: '/customers', icon: 'lookup', iconColor: 'green' },
    { id: 'record-repayment', title: 'Record manual repayment', description: 'Log a repayment received outside auto-deduction.', category: 'Loan Actions', route: '/loans/repayments', icon: 'repayment', iconColor: 'blue' },
    { id: 'review-approvals', title: 'Review pending approvals', description: 'Work through loan applications awaiting sign-off.', category: 'Loan Actions', route: '/loans/processing', icon: 'approvals', iconColor: 'purple', badgeCount: () => this._pendingApprovalsCount() },
    { id: 'flag-loan', title: 'Flag loan for review', description: 'Escalate a loan for risk or collections attention.', category: 'Loan Actions', route: '/risk-monitor', icon: 'flag', iconColor: 'red' },
    { id: 'restructure-loan', title: 'Restructure loan', description: 'Adjust tenor, rate, or repayment plan for an existing loan.', category: 'Loan Actions', route: '/loans', icon: 'restructure', iconColor: 'teal' },

    // Customer Actions
    { id: 'add-customer', title: 'Add new customer', description: 'Onboard a new borrower and verify their KYC documents.', category: 'Customer Actions', route: '/customers', icon: 'add-customer', iconColor: 'green' },
    { id: 'run-kyc', title: 'Run KYC check', description: 'Verify BVN, NIN, or uploaded identity documents.', category: 'Customer Actions', route: '/customers', icon: 'kyc', iconColor: 'blue' },
    { id: 'link-salary', title: 'Link salary account', description: "Connect a customer's employer salary account for deductions.", category: 'Customer Actions', route: '/customers', icon: 'link-account', iconColor: 'purple' },

    // Product Actions
    { id: 'create-product', title: 'Create loan product', description: 'Define terms, fees, and eligibility rules for a new offering.', category: 'Product Actions', route: '/products/create', icon: 'product', iconColor: 'blue' },
    { id: 'view-product-performance', title: 'View product performance', description: 'Applications, disbursement, and collection rates by product.', category: 'Product Actions', route: '/products', icon: 'performance', iconColor: 'teal' },

    // Reports
    { id: 'generate-portfolio-report', title: 'Generate portfolio report', description: 'Export loan performance and collection analytics.', category: 'Reports', route: '/reports', icon: 'report', iconColor: 'purple' },
    { id: 'export-repayment-schedule', title: 'Export repayment schedule', description: 'Download upcoming and historical repayment schedules.', category: 'Reports', route: '/loans/repayments', icon: 'schedule', iconColor: 'blue' },
    { id: 'view-overdue-report', title: 'View overdue report', description: 'See loans past due and days-overdue breakdown.', category: 'Reports', route: '/risk-monitor', icon: 'overdue', iconColor: 'red' },

    // Wallet
    { id: 'topup-wallet', title: 'Top up wallet', description: 'Add funds to your disbursement wallet.', category: 'Wallet', route: '/wallet', icon: 'wallet', iconColor: 'green' },
    { id: 'download-wallet-statement', title: 'Download wallet statement', description: 'Export a statement of wallet transactions.', category: 'Wallet', route: '/wallet', icon: 'statement', iconColor: 'gray' },
  ];

  readonly categories: QuickActionCategory[] = ['Loan Actions', 'Customer Actions', 'Product Actions', 'Reports', 'Wallet'];

  readonly groupedActions = computed(() =>
    this.categories.map((category) => ({
      category,
      actions: this.actions.filter((a) => a.category === category),
    })),
  );

  getById(id: string): QuickAction | undefined {
    return this.actions.find((a) => a.id === id);
  }

  // ── Recent actions (persisted in-memory + localStorage) ──
  private readonly _recentIds = signal<string[]>(this.loadRecent());

  readonly recentActions = computed<QuickAction[]>(() =>
    this._recentIds()
      .map((id) => this.getById(id))
      .filter((a): a is QuickAction => !!a),
  );

  recordRecent(id: string) {
    const next = [id, ...this._recentIds().filter((existing) => existing !== id)].slice(0, MAX_RECENT);
    this._recentIds.set(next);
    this.persistRecent(next);
  }

  private loadRecent(): string[] {
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore malformed storage */
    }
    return [];
  }

  private persistRecent(ids: string[]) {
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore quota errors */
    }
  }
}
