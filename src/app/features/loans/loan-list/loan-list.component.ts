import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Download01Icon, Wallet01Icon, MoreVerticalIcon, ViewIcon } from '@hugeicons/core-free-icons';
import {
  ChartComponent,
  ChartDataPoint,
  ColumnTitleComponent,
  BadgeStatus,
  ButtonComponent,
  IconData,
  RoundTabsComponent,
  Tab,
  SelectComponent,
  SelectOption,
  SearchComponent,
  CheckboxComponent,
  StatusBadgeComponent,
  HiIconComponent,
  RowMenuComponent,
} from '../../../shared/components';
import { ProductsService } from '../../../shared/services/products.service';
import { LoansService, LoanApplication, LoanStatus } from '../../../shared/services/loans.service';

/**
 * Query-param values the sidebar's Loans dropdown links with (`/loans?status=...`).
 * Mapping to our 6-status set is a product decision, not a technical one — see comment
 * on `statusParamFilter()` below for the reasoning behind each mapping.
 */
type StatusParam = 'all' | 'requests' | 'in-review' | 'on-hold' | 'cancelled' | 'disbursed';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [
    RouterLink, ChartComponent, ColumnTitleComponent, ButtonComponent,
    RoundTabsComponent, SelectComponent, SearchComponent, CheckboxComponent, StatusBadgeComponent,
    HiIconComponent, RowMenuComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-list.component.html',
  styleUrl: './loan-list.component.scss',
  host: { '(document:click)': 'closeMenus()' },
})
export class LoanListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly loansService = inject(LoansService);

  readonly downloadIcon: IconData = Download01Icon as IconData;
  readonly giveLoanIcon: IconData = Wallet01Icon as IconData;
  readonly moreIcon: IconData = MoreVerticalIcon as IconData;
  readonly viewIcon: IconData = ViewIcon as IconData;

  readonly disbursementTrend: ChartDataPoint[] = [
    { label: 'Mon', value: 12 }, { label: 'Tue', value: 18 }, { label: 'Wed', value: 14 },
    { label: 'Thu', value: 22 }, { label: 'Fri', value: 19 }, { label: 'Sat', value: 9 }, { label: 'Sun', value: 15 },
  ];

  // Per-card period pill options (Today/This week/This month) — a page-level filter would
  // live above the stat row; these are deliberately independent per the reference screenshot.
  readonly periodOptions: SelectOption[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
  ];
  readonly activeLoansPeriod = signal('today');
  readonly customersServedPeriod = signal('today');
  readonly disbursedPeriod = signal('today');

  readonly statActiveLoans = computed(() => this.loansService.loans().filter((l) => l.status === 'disbursed' || l.status === 'top_up_request').length);
  readonly statCustomersServed = computed(() => new Set(this.loansService.loans().map((l) => l.applicantIdentifier)).size);
  readonly statTotalDisbursed = computed(() => {
    const total = this.loansService.loans()
      .filter((l) => l.status === 'disbursed' || l.status === 'top_up_request' || l.status === 'closed')
      .reduce((sum, l) => sum + l.amount, 0);
    return `₦${total.toLocaleString()}`;
  });

  /** Status query-param filter, driven by the sidebar's Loans dropdown (/loans?status=...). */
  readonly statusParam = signal<StatusParam>('all');

  constructor() {
    this.route.queryParams.subscribe((params) => {
      const status = (params['status'] as StatusParam) || 'all';
      this.statusParam.set(status);
    });
  }

  /**
   * Mapping reasoning (product decision, not purely technical):
   * - 'requests'  → New: a fresh loan request that hasn't moved into review yet.
   * - 'in-review' → Documents Review: application is being underwritten/verified.
   * - 'on-hold'   → Top Up Request: an existing loan paused pending a top-up decision —
   *                 the closest concept to "on hold" in our 6-status set.
   * - 'cancelled' → Declined + Closed: both are terminal/non-active outcomes a user would
   *                 expect under a "cancelled" filter bucket.
   * - 'disbursed' → Disbursed: direct 1:1 match.
   * - 'all'       → no filter.
   */
  private statusesForParam(param: StatusParam): LoanStatus[] | null {
    switch (param) {
      case 'requests': return ['new'];
      case 'in-review': return ['documents_review'];
      case 'on-hold': return ['top_up_request'];
      case 'cancelled': return ['declined', 'closed'];
      case 'disbursed': return ['disbursed'];
      default: return null;
    }
  }

  // Product-based tabs, sourced from the real product catalogue and filtered by productId
  // (not name) — two products can share a display name, but ids are always unique.
  readonly productTabs = computed<Tab[]>(() => {
    const products = this.productsService.products();
    return [{ label: 'All Products', value: 'all' }, ...products.map((p) => ({ label: p.name, value: p.id }))];
  });
  readonly activeProduct = signal('all');
  setProduct(value: string) {
    this.activeProduct.set(value);
  }

  readonly channelOptions: SelectOption[] = [
    { value: 'all', label: 'All channels' },
    { value: 'IPPIS', label: 'IPPIS' },
    { value: 'Remita', label: 'Remita' },
    { value: 'Dedukt', label: 'Dedukt' },
    { value: 'WACS', label: 'WACS' },
    { value: 'Direct Debit', label: 'Direct Debit' },
  ];
  readonly channelFilter = signal('all');
  readonly filterPanelOpen = signal(false);

  toggleFilterPanel() {
    this.filterPanelOpen.update((v) => !v);
  }

  setChannelFilter(value: string) {
    this.channelFilter.set(value);
  }

  readonly searchQuery = signal('');
  readonly selectedIds = signal<Set<string>>(new Set());

  productName(productId: string): string {
    return this.productsService.getById(productId)?.name ?? productId;
  }

  /** The channel this loan is primarily collected through — first enabled rail on the application. */
  primaryChannel(loan: LoanApplication): string {
    return loan.deductionChannelStatus[0]?.rail ?? '—';
  }

  get filteredLoans(): LoanApplication[] {
    let list = this.loansService.loans();

    const statuses = this.statusesForParam(this.statusParam());
    if (statuses) list = list.filter((l) => statuses.includes(l.status));

    if (this.activeProduct() !== 'all') list = list.filter((l) => l.productId === this.activeProduct());
    if (this.channelFilter() !== 'all') list = list.filter((l) => this.primaryChannel(l) === this.channelFilter());

    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter((l) =>
        l.loanUniqueId.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q) ||
        this.productName(l.productId).toLowerCase().includes(q),
      );
    }

    return list;
  }

  readonly anySelected = computed(() => this.selectedIds().size > 0);
  readonly selectedCount = computed(() => this.selectedIds().size);

  toggleSelect(loan: LoanApplication, checked: boolean) {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      checked ? next.add(loan.id) : next.delete(loan.id);
      return next;
    });
  }

  clearSelection() {
    this.selectedIds.set(new Set());
  }

  statusBadge(status: LoanStatus): { status: BadgeStatus; label: string } {
    switch (status) {
      case 'new': return { status: 'active', label: 'New' };
      case 'declined': return { status: 'failed', label: 'Declined' };
      case 'documents_review': return { status: 'pending', label: 'Documents Review' };
      case 'closed': return { status: 'dormant', label: 'Closed' };
      case 'disbursed': return { status: 'successful', label: 'Disbursed' };
      case 'top_up_request': return { status: 'suspended', label: 'Top Up Request' };
    }
  }

  readonly menuOpenId = signal<string | null>(null);

  toggleRowMenu(event: Event, loan: LoanApplication) {
    event.stopPropagation();
    this.menuOpenId.update((id) => (id === loan.id ? null : loan.id));
  }

  closeMenus() {
    this.filterPanelOpen.set(false);
    this.menuOpenId.set(null);
  }

  bulkExport() {
    const selected = this.loansService.loans().filter((l) => this.selectedIds().has(l.id));
    this.downloadCsv(selected);
    this.clearSelection();
  }

  bulkAssignOfficer() {
    this.clearSelection();
  }

  exportAll() {
    this.downloadCsv(this.filteredLoans);
  }

  private downloadCsv(rows: LoanApplication[]) {
    const header = 'Loan Unique ID,Date,Customer,Phone,Product,Workplace,Amount,Tenor,Total Repayment,Monthly Repayment,Referral Code,Status\n';
    const body = rows
      .map((l) => `${l.loanUniqueId},${l.appliedAt.slice(0, 10)},${l.customerName},${l.customerPhone},${this.productName(l.productId)},${l.workplace},₦${l.amount.toLocaleString()},${l.tenor} months,₦${l.totalRepayment.toLocaleString()},₦${l.monthlyRepayment.toLocaleString()},${l.referralCode},${this.statusBadge(l.status).label}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loans-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
