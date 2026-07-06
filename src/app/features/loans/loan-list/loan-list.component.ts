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
} from '../../../shared/components';
import { ProductsService } from '../../../shared/services/products.service';

/**
 * The 6 statuses shown in the reference screenshot. `label` below is always the real
 * English word shown to the user — `BadgeStatus` (see statusBadge()) only controls tint.
 */
type LoanStatus = 'new' | 'declined' | 'documents-review' | 'closed' | 'disbursed' | 'top-up-request';
type Channel = 'IPPIS' | 'Remita' | 'Dedukt' | 'WACS' | 'Direct Debit';

/**
 * Query-param values the sidebar's Loans dropdown links with (`/loans?status=...`).
 * Mapping to our 6-status set is a product decision, not a technical one — see comment
 * on `statusParamFilter()` below for the reasoning behind each mapping.
 */
type StatusParam = 'all' | 'requests' | 'in-review' | 'on-hold' | 'cancelled' | 'disbursed';

interface LoanRow {
  id: string;
  date: string;
  customer: { name: string; email: string };
  workplaceId: string;
  product: string;
  channel: Channel;
  amount: string;
  tenor: number;
  workplace: string;
  /** Total amount to be repaid across the full tenor. */
  repaymentTotal: string;
  /** Amount deducted per repayment period (e.g. per month). */
  repaymentPerPeriod: string;
  status: LoanStatus;
  selected?: boolean;
  menuOpen?: boolean;
}

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [
    RouterLink, ChartComponent, ColumnTitleComponent, ButtonComponent,
    RoundTabsComponent, SelectComponent, SearchComponent, CheckboxComponent, StatusBadgeComponent,
    HiIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-list.component.html',
  styleUrl: './loan-list.component.scss',
  host: { '(document:click)': 'closeMenus()' },
})
export class LoanListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);

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

  // Realistic non-zero mock stats (values would normally come from a stats service).
  readonly statActiveLoans = 128;
  readonly statCustomersServed = 412;
  readonly statTotalDisbursed = '₦18,400,000';

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
      case 'in-review': return ['documents-review'];
      case 'on-hold': return ['top-up-request'];
      case 'cancelled': return ['declined', 'closed'];
      case 'disbursed': return ['disbursed'];
      default: return null;
    }
  }

  // Product-based tabs, sourced from the real product catalogue (deduped by name).
  readonly productTabs = computed<Tab[]>(() => {
    const names = [...new Set(this.productsService.products().map((p) => p.name))];
    return [{ label: 'All Products', value: 'all' }, ...names.map((name) => ({ label: name, value: name }))];
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

  readonly loans = signal<LoanRow[]>([
    { id: 'LN-202406-001', date: '2026-06-02', customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, workplaceId: 'IPPIS/2024/00821', product: 'Corper Wallet', channel: 'Remita', amount: '₦150,000', tenor: 6, workplace: 'Federal Ministry of Works', repaymentTotal: '₦165,000', repaymentPerPeriod: '₦27,500', status: 'disbursed' },
    { id: 'LN-202406-002', date: '2026-06-05', customer: { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' }, workplaceId: 'IPPIS/2024/01143', product: 'Credit Wallet', channel: 'IPPIS', amount: '₦75,000', tenor: 3, workplace: 'Lagos State Government', repaymentTotal: '₦78,900', repaymentPerPeriod: '₦26,300', status: 'new' },
    { id: 'LN-202406-003', date: '2026-05-28', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, workplaceId: 'IPPIS/2023/00456', product: 'Credit Alert', channel: 'Dedukt', amount: '₦320,000', tenor: 12, workplace: 'Dangote Group', repaymentTotal: '₦358,800', repaymentPerPeriod: '₦29,900', status: 'documents-review' },
    { id: 'LN-202406-004', date: '2026-06-10', customer: { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' }, workplaceId: 'IPPIS/2024/02219', product: 'WACS', channel: 'WACS', amount: '₦45,000', tenor: 9, workplace: 'NYSC Corps Members', repaymentTotal: '₦47,700', repaymentPerPeriod: '₦5,300', status: 'declined' },
    { id: 'LN-202406-005', date: '2026-05-15', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, workplaceId: 'IPPIS/2022/00981', product: 'Corper Wallet', channel: 'Direct Debit', amount: '₦210,000', tenor: 6, workplace: 'Federal Ministry of Works', repaymentTotal: '₦231,000', repaymentPerPeriod: '₦38,500', status: 'top-up-request' },
    { id: 'LN-202406-006', date: '2026-04-20', customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, workplaceId: 'IPPIS/2023/01732', product: 'Credit Wallet', channel: 'Remita', amount: '₦95,000', tenor: 6, workplace: 'Lagos State Government', repaymentTotal: '₦104,400', repaymentPerPeriod: '₦17,400', status: 'closed' },
    { id: 'LN-202406-007', date: '2026-06-18', customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, workplaceId: 'IPPIS/2024/03012', product: 'Corper Wallet', channel: 'IPPIS', amount: '₦60,000', tenor: 3, workplace: 'NYSC Corps Members', repaymentTotal: '₦63,000', repaymentPerPeriod: '₦21,000', status: 'disbursed' },
    { id: 'LN-202406-008', date: '2026-06-21', customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, workplaceId: 'IPPIS/2024/00821', product: 'Quick Buy BNPL', channel: 'Remita', amount: '₦120,000', tenor: 4, workplace: 'Federal Ministry of Works', repaymentTotal: '₦127,200', repaymentPerPeriod: '₦31,800', status: 'new' },
  ]);

  get filteredLoans(): LoanRow[] {
    let list = this.loans();

    const statuses = this.statusesForParam(this.statusParam());
    if (statuses) list = list.filter((l) => statuses.includes(l.status));

    if (this.activeProduct() !== 'all') list = list.filter((l) => l.product === this.activeProduct());
    if (this.channelFilter() !== 'all') list = list.filter((l) => l.channel === this.channelFilter());

    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter((l) =>
        l.id.toLowerCase().includes(q) ||
        l.customer.name.toLowerCase().includes(q) ||
        l.product.toLowerCase().includes(q),
      );
    }

    return list;
  }

  readonly anySelected = computed(() => this.loans().some((l) => l.selected));
  readonly selectedCount = computed(() => this.loans().filter((l) => l.selected).length);

  toggleSelect(loan: LoanRow, checked: boolean) {
    this.loans.update((all) => all.map((l) => (l.id === loan.id ? { ...l, selected: checked } : l)));
  }

  clearSelection() {
    this.loans.update((all) => all.map((l) => ({ ...l, selected: false })));
  }

  statusBadge(status: LoanStatus): { status: BadgeStatus; label: string } {
    switch (status) {
      case 'new': return { status: 'active', label: 'New' };
      case 'declined': return { status: 'failed', label: 'Declined' };
      case 'documents-review': return { status: 'pending', label: 'Documents Review' };
      case 'closed': return { status: 'dormant', label: 'Closed' };
      case 'disbursed': return { status: 'successful', label: 'Disbursed' };
      case 'top-up-request': return { status: 'suspended', label: 'Top Up Request' };
    }
  }

  toggleRowMenu(event: Event, loan: LoanRow) {
    event.stopPropagation();
    const wasOpen = loan.menuOpen;
    this.loans.update((all) => all.map((l) => ({ ...l, menuOpen: false })));
    if (!wasOpen) {
      this.loans.update((all) => all.map((l) => (l.id === loan.id ? { ...l, menuOpen: true } : l)));
    }
  }

  closeMenus() {
    this.filterPanelOpen.set(false);
    this.loans.update((all) => (all.some((l) => l.menuOpen) ? all.map((l) => ({ ...l, menuOpen: false })) : all));
  }

  bulkExport() {
    const selected = this.loans().filter((l) => l.selected);
    this.downloadCsv(selected);
    this.clearSelection();
  }

  bulkAssignOfficer() {
    this.clearSelection();
  }

  exportAll() {
    this.downloadCsv(this.filteredLoans);
  }

  private downloadCsv(rows: LoanRow[]) {
    const header = 'Loan ID,Date,Customer,Workplace ID,Product,Workplace,Channel,Amount,Tenor,Repayment Total,Repayment Per Period,Status\n';
    const body = rows
      .map((l) => `${l.id},${l.date},${l.customer.name},${l.workplaceId},${l.product},${l.workplace},${l.channel},${l.amount},${l.tenor} months,${l.repaymentTotal},${l.repaymentPerPeriod},${this.statusBadge(l.status).label}`)
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
