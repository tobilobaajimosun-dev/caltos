import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  ButtonComponent,
  TabsComponent,
  TabItem,
  RoundTabsComponent,
  Tab,
  ChartComponent,
  ChartDataPoint,
  ChartSeries,
  DrawerComponent,
  SelectComponent,
  SelectOption,
  InputComponent,
  SkeletonComponent,
  EmptyStateComponent,
  RowMenuComponent,
} from '../../shared/components';

type ReportFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'On demand';
type ReportExportFormat = 'CSV' | 'CSV/Excel';
type UserRole = 'Admin' | 'Loan Officer';
type PeriodId = '7d' | '30d' | '90d' | 'custom';

interface ReportDef {
  title: string;
  description: string;
  frequency: ReportFrequency;
  exportFormat: ReportExportFormat;
  autoSend: boolean;
  recipients: string[];
}

interface MetricCard {
  label: string;
  amount: string;
  trend: { dir: 'up' | 'down'; value: number } | null;
  trendColor: string;
  countLabel: string;
  countVal: string;
}

interface ExportRecord {
  date: string;
  type: string;
  size: string;
}

interface AgingBucket {
  bucket: string;
  count: number;
  amount: string;
  parPct: number;
}

interface OverdueLoan {
  customer: string;
  loanId: string;
  daysOverdue: number;
  amount: string;
  lastContact: string;
}

interface RepayerRow {
  customer: string;
  loansCompleted: number;
  onTimeRate: string;
  totalRepaid: string;
}

interface ProductRow {
  product: string;
  disbursed: string;
  active: number;
  nplPct: string;
  collectionRate: string;
  avgTenor: string;
  avgSize: string;
}

interface OfficerRow {
  rank: number;
  officer: string;
  loansDisbursed: number;
  amount: string;
  collectionRate: string;
  overdueAssigned: number;
}

interface SegmentRow {
  segment: string;
  customers: number;
  pct: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    ButtonComponent,
    TabsComponent,
    RoundTabsComponent,
    ChartComponent,
    DrawerComponent,
    SelectComponent,
    InputComponent,
    SkeletonComponent,
    EmptyStateComponent,
    RowMenuComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  host: { '(document:click)': 'closeExportMenus()' },
})
export class ReportsComponent {
  mainTab: 'report' | 'export' = 'report';

  // Mock "current role" signal — stub for role-gating, not real RBAC.
  readonly currentRole = signal<UserRole>('Admin');
  readonly roleOptions: SelectOption[] = [
    { value: 'Admin', label: 'Admin (full data)' },
    { value: 'Loan Officer', label: 'Loan Officer (filtered)' },
  ];

  readonly reportSubTabs: Tab[] = [
    { label: 'Overview', value: 'overview' },
    { label: 'Portfolio Summary', value: 'portfolio-summary' },
    { label: 'Overdue & Collections', value: 'overdue-collections' },
    { label: 'Repayment Performance', value: 'repayment-performance' },
    { label: 'Customer Acquisition', value: 'customer-acquisition' },
    { label: 'Product Performance', value: 'product-performance' },
    { label: 'Officer Performance', value: 'officer-performance' },
  ];
  reportSubTab = 'overview';

  /** Quick Report Links on the Overview screen jump straight to a sub-report tab. */
  goToReport(tab: string) {
    this.reportSubTab = tab;
  }

  readonly periodTabs: TabItem[] = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: 'custom', label: 'Custom' },
  ];
  readonly activePeriod = signal<PeriodId>('30d');

  // Loading/empty state toggles — simple signal-driven simulation (frontend-only mock-data app).
  readonly chartsLoading = signal(false);
  readonly forceEmptyCharts = signal(false);

  setPeriod(id: string) {
    this.activePeriod.set(id as PeriodId);
    this.chartsLoading.set(true);
    setTimeout(() => this.chartsLoading.set(false), 500);
  }

  // Period multiplier so KPI/chart data visibly reacts to the date range picker.
  private readonly periodScale = computed(() => {
    switch (this.activePeriod()) {
      case '7d': return 0.25;
      case '90d': return 2.6;
      case 'custom': return 1.4;
      default: return 1; // 30d baseline
    }
  });

  private fmtNaira(n: number): string {
    return '₦' + Math.round(n).toLocaleString('en-NG');
  }

  // ---- Screen 1: Reports Overview — 6 KPIs per issue #7 ----
  readonly kpis = computed<MetricCard[]>(() => {
    const scale = this.periodScale();
    return [
      { label: 'Total Disbursed', amount: this.fmtNaira(1_797_120_000 * scale), trend: { dir: 'up', value: 40 }, trendColor: '#059669', countLabel: 'vs previous period', countVal: '+40%' },
      { label: 'Total Repaid', amount: this.fmtNaira(1_345_900_000 * scale), trend: { dir: 'up', value: 32 }, trendColor: '#059669', countLabel: 'vs previous period', countVal: '+32%' },
      { label: 'Outstanding Book', amount: this.fmtNaira(620_000_000 * scale), trend: { dir: 'up', value: 12 }, trendColor: '#f59e0b', countLabel: '% change', countVal: '+12%' },
      { label: 'Non-Performing Loans (NPL)', amount: '4.8%', trend: { dir: 'down', value: 0.6 }, trendColor: '#e03e3e', countLabel: '% of book', countVal: '4.8%' },
      { label: 'New Customers', amount: Math.round(4210 * scale).toLocaleString('en-NG'), trend: { dir: 'up', value: 23 }, trendColor: '#059669', countLabel: 'vs previous period', countVal: '+23%' },
      { label: 'Avg Collection Rate', amount: '92.4%', trend: { dir: 'up', value: 3.1 }, trendColor: '#059669', countLabel: 'trend', countVal: '+3.1pp' },
    ];
  });

  // ---- Overview Chart 1: Disbursement vs Repayment grouped bar by month ----
  readonly disbursementRepaymentSeries = computed<ChartSeries[]>(() => {
    const scale = this.periodScale();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const disbursed = [180, 210, 195, 240, 225, 260].map((v) => Math.round(v * scale));
    const repaid = [140, 175, 160, 205, 190, 230].map((v) => Math.round(v * scale));
    return [
      { name: 'Disbursed', color: 'var(--color-blue)', data: months.map((m, i) => ({ label: m, value: disbursed[i] })) },
      { name: 'Repaid', color: '#059669', data: months.map((m, i) => ({ label: m, value: repaid[i] })) },
    ];
  });

  // ---- Overview Chart 2: Portfolio Growth stacked area (principal outstanding) ----
  readonly portfolioGrowthSeries = computed<ChartSeries[]>(() => {
    const scale = this.periodScale();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const performing = [320, 340, 360, 390, 410, 440].map((v) => Math.round(v * scale));
    const watch = [40, 45, 48, 52, 55, 58].map((v) => Math.round(v * scale));
    const nonPerforming = [20, 22, 25, 24, 27, 30].map((v) => Math.round(v * scale));
    return [
      { name: 'Performing principal', color: 'var(--color-blue)', data: months.map((m, i) => ({ label: m, value: performing[i] })) },
      { name: 'Watchlist principal', color: '#f59e0b', data: months.map((m, i) => ({ label: m, value: watch[i] })) },
      { name: 'Non-performing principal', color: '#e03e3e', data: months.map((m, i) => ({ label: m, value: nonPerforming[i] })) },
    ];
  });

  // ---- Overview Chart 3: NPL Trend line ----
  readonly nplTrend = computed<ChartDataPoint[]>(() => {
    const base = [5.4, 5.1, 4.9, 5.2, 4.9, 4.8];
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => ({ label: m, value: base[i] }));
  });

  readonly lendingTrend: ChartDataPoint[] = [
    { label: 'Jan', value: 12 }, { label: 'Feb', value: 18 }, { label: 'Mar', value: 15 },
    { label: 'Apr', value: 24 }, { label: 'May', value: 20 }, { label: 'Jun', value: 28 },
  ];

  readonly loanStatusSplit = [
    { label: 'Repaid',  count: 1847, pct: 57, color: '#059669' },
    { label: 'Active',  count: 648,  pct: 20, color: '#0053a6' },
    { label: 'Overdue', count: 320,  pct: 10, color: '#f59e0b' },
    { label: 'Written off', count: 425, pct: 13, color: '#e03e3e' },
  ];

  readonly loanStatusGradient = (() => {
    let acc = 0;
    const stops = this.loanStatusSplit.map((s) => {
      const start = acc;
      acc += s.pct;
      return `${s.color} ${start}% ${acc}%`;
    });
    return `conic-gradient(${stops.join(', ')}, var(--color-stroke) ${acc}% 100%)`;
  })();

  // ---- Screen 2: Portfolio Summary — product-by-product breakdown ----
  readonly portfolioByProduct: ProductRow[] = [
    { product: 'Salary Advance', disbursed: '₦980,000,000', active: 1120, nplPct: '3.9%', collectionRate: '94.1%', avgTenor: '3 mo', avgSize: '₦180,000' },
    { product: 'Credit Wallet',  disbursed: '₦520,000,000', active: 540,  nplPct: '5.6%', collectionRate: '89.8%', avgTenor: '1 mo', avgSize: '₦95,000' },
    { product: 'Corper Wallet',  disbursed: '₦297,120,000', active: 180,  nplPct: '6.2%', collectionRate: '87.4%', avgTenor: '2 mo', avgSize: '₦65,000' },
  ];

  readonly portfolioByOfficer = [
    { officer: 'Adaeze Nwosu', loans: 412, outstanding: '₦210,000,000', nplPct: '3.2%' },
    { officer: 'Tunde Bakare', loans: 356, outstanding: '₦185,500,000', nplPct: '4.8%' },
    { officer: 'Ifeoma Chukwu', loans: 298, outstanding: '₦140,200,000', nplPct: '5.9%' },
  ];

  readonly portfolioByLocation = [
    { location: 'Lagos', loans: 820, outstanding: '₦340,000,000' },
    { location: 'Abuja', loans: 410, outstanding: '₦150,000,000' },
    { location: 'Port Harcourt', loans: 260, outstanding: '₦85,000,000' },
    { location: 'Other', loans: 350, outstanding: '₦45,000,000' },
  ];

  // ---- Screen 3: Overdue & Collections ----
  readonly agingBuckets: AgingBucket[] = [
    { bucket: '1–30 days',  count: 210, amount: '₦58,400,000', parPct: 9.4 },
    { bucket: '31–60 days', count: 96,  amount: '₦31,200,000', parPct: 5.0 },
    { bucket: '61–90 days', count: 54,  amount: '₦19,800,000', parPct: 3.2 },
    { bucket: '90+ days',   count: 38,  amount: '₦22,600,000', parPct: 3.6 },
  ];

  readonly parByBucket = computed<ChartDataPoint[]>(() =>
    this.agingBuckets.map((b) => ({ label: b.bucket, value: b.parPct }))
  );

  readonly overdueLoans: OverdueLoan[] = [
    { customer: 'Chinedu Okafor', loanId: 'LN-10234', daysOverdue: 12, amount: '₦120,000', lastContact: '2026-06-28' },
    { customer: 'Blessing Eze',   loanId: 'LN-10287', daysOverdue: 34, amount: '₦85,000',  lastContact: '2026-06-20' },
    { customer: 'Musa Abdullahi', loanId: 'LN-10301', daysOverdue: 67, amount: '₦240,000', lastContact: '2026-06-05' },
    { customer: 'Grace Umeh',     loanId: 'LN-10315', daysOverdue: 95, amount: '₦310,000', lastContact: '2026-05-14' },
    { customer: 'Tobi Salako',    loanId: 'LN-10329', daysOverdue: 8,  amount: '₦60,000',  lastContact: '2026-07-01' },
  ];
  readonly selectedOverdueLoans = signal<Set<string>>(new Set());

  toggleOverdueSelection(loanId: string) {
    const next = new Set(this.selectedOverdueLoans());
    if (next.has(loanId)) next.delete(loanId); else next.add(loanId);
    this.selectedOverdueLoans.set(next);
  }

  bulkSendReminder() {
    const count = this.selectedOverdueLoans().size;
    this.selectedOverdueLoans.set(new Set());
    alert(`Reminder sent for ${count} loan(s).`);
  }

  bulkAssignCollections() {
    const count = this.selectedOverdueLoans().size;
    this.selectedOverdueLoans.set(new Set());
    alert(`${count} loan(s) assigned to collections.`);
  }

  // ---- Screen 4: Repayment Performance ----
  readonly onTimeRateTrend: ChartDataPoint[] = [
    { label: 'Jan', value: 88 }, { label: 'Feb', value: 90 }, { label: 'Mar', value: 87 },
    { label: 'Apr', value: 91 }, { label: 'May', value: 93 }, { label: 'Jun', value: 92 },
  ];

  readonly repaymentSplit = [
    { label: 'Early',   pct: 28, color: '#059669' },
    { label: 'On-time', pct: 54, color: '#0053a6' },
    { label: 'Late',    pct: 18, color: '#f59e0b' },
  ];

  readonly repaymentSplitGradient = (() => {
    let acc = 0;
    const stops = this.repaymentSplit.map((s) => {
      const start = acc;
      acc += s.pct;
      return `${s.color} ${start}% ${acc}%`;
    });
    return `conic-gradient(${stops.join(', ')}, var(--color-stroke) ${acc}% 100%)`;
  })();

  readonly topRepayers: RepayerRow[] = [
    { customer: 'Amaka Obi',      loansCompleted: 9, onTimeRate: '100%', totalRepaid: '₦1,240,000' },
    { customer: 'Emeka Nwachukwu', loansCompleted: 7, onTimeRate: '98%',  totalRepaid: '₦980,000' },
    { customer: 'Fatima Bello',    loansCompleted: 6, onTimeRate: '97%',  totalRepaid: '₦860,000' },
  ];

  readonly bottomRepayers: RepayerRow[] = [
    { customer: 'Musa Abdullahi', loansCompleted: 3, onTimeRate: '41%', totalRepaid: '₦210,000' },
    { customer: 'Grace Umeh',     loansCompleted: 2, onTimeRate: '38%', totalRepaid: '₦140,000' },
    { customer: 'Chinedu Okafor', loansCompleted: 4, onTimeRate: '52%', totalRepaid: '₦260,000' },
  ];

  // ---- Screen 5: Customer Acquisition ----
  readonly newCustomersTrend: ChartDataPoint[] = [
    { label: 'Jan', value: 320 }, { label: 'Feb', value: 410 }, { label: 'Mar', value: 380 },
    { label: 'Apr', value: 460 }, { label: 'May', value: 510 }, { label: 'Jun', value: 590 },
  ];

  readonly retention = [
    { label: 'Repeat borrowers',     pct: 62, color: '#0053a6' },
    { label: 'First-time borrowers', pct: 38, color: '#f59e0b' },
  ];

  readonly customerSegmentsBySize: SegmentRow[] = [
    { segment: '< ₦50,000',        customers: 1240, pct: 34 },
    { segment: '₦50,000–₦200,000', customers: 1580, pct: 43 },
    { segment: '> ₦200,000',       customers: 840,  pct: 23 },
  ];

  readonly customerSegmentsByProduct: SegmentRow[] = [
    { segment: 'Salary Advance', customers: 2100, pct: 57 },
    { segment: 'Credit Wallet',  customers: 980,  pct: 27 },
    { segment: 'Corper Wallet',  customers: 580,  pct: 16 },
  ];

  readonly geoDistribution = [
    { location: 'Lagos', pct: 38 },
    { location: 'Abuja', pct: 19 },
    { location: 'Port Harcourt', pct: 12 },
    { location: 'Kano', pct: 9 },
    { location: 'Other', pct: 22 },
  ];

  // ---- Screen 6: Product Performance ----
  readonly productComparison: ProductRow[] = this.portfolioByProduct;

  readonly productComparisonRows = computed(() =>
    this.productComparison.map((r) => [r.product, r.disbursed, r.active, r.nplPct, r.collectionRate, r.avgTenor, r.avgSize])
  );

  // ---- Screen 7: Officer/Team Performance ----
  readonly officerLeaderboard: OfficerRow[] = [
    { rank: 1, officer: 'Adaeze Nwosu',  loansDisbursed: 412, amount: '₦210,000,000', collectionRate: '96.8%', overdueAssigned: 14 },
    { rank: 2, officer: 'Tunde Bakare',  loansDisbursed: 356, amount: '₦185,500,000', collectionRate: '94.1%', overdueAssigned: 19 },
    { rank: 3, officer: 'Ifeoma Chukwu', loansDisbursed: 298, amount: '₦140,200,000', collectionRate: '91.7%', overdueAssigned: 22 },
    { rank: 4, officer: 'Yusuf Garba',   loansDisbursed: 240, amount: '₦110,000,000', collectionRate: '89.4%', overdueAssigned: 27 },
  ];

  readonly officerLeaderboardRows = computed(() =>
    this.officerLeaderboard.map((r) => [r.rank, r.officer, r.loansDisbursed, r.amount, r.collectionRate, r.overdueAssigned])
  );

  readonly overdueLoanRows = computed(() =>
    this.overdueLoans.map((r) => [r.customer, r.loanId, r.daysOverdue, r.amount, r.lastContact])
  );

  readonly topRepayerRows = computed(() =>
    this.topRepayers.map((r) => [r.customer, r.loansCompleted, r.onTimeRate, r.totalRepaid])
  );

  readonly customerSegmentRows = computed(() =>
    [...this.customerSegmentsBySize, ...this.customerSegmentsByProduct].map((r) => [r.segment, r.customers, r.pct])
  );

  readonly channelOptions: SelectOption[] = [
    { value: 'all', label: 'All channels' },
    { value: 'IPPIS', label: 'IPPIS' },
    { value: 'Remita', label: 'Remita' },
    { value: 'Dedukt', label: 'Dedukt' },
    { value: 'WACS', label: 'WACS' },
    { value: 'Direct Debit', label: 'Direct Debit' },
  ];
  readonly channelFilter = signal('all');

  readonly productOptions: SelectOption[] = [
    { value: 'all', label: 'All products' },
    { value: 'salary-advance', label: 'Salary Advance' },
    { value: 'credit-wallet', label: 'Credit Wallet' },
    { value: 'corper-wallet', label: 'Corper Wallet' },
  ];
  readonly productFilter = signal('all');

  readonly statusOptions: SelectOption[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'closed', label: 'Closed' },
  ];
  readonly statusFilter = signal('all');

  readonly dateFrom = signal('2026-06-01');
  readonly dateTo = signal('2026-07-05');

  readonly reports: ReportDef[] = [
    { title: 'Daily failed deduction report', description: 'All failed deductions across channels, refreshed each morning.', frequency: 'Daily', exportFormat: 'CSV', autoSend: true, recipients: ['ops@princepsfinance.com'] },
    { title: 'Monthly variance & reconciliation summary', description: 'Expected vs. actual collections, matched/unmatched breakdown.', frequency: 'Monthly', exportFormat: 'CSV/Excel', autoSend: true, recipients: ['finance@princepsfinance.com'] },
    { title: 'Aging analysis — overdue loans', description: 'Delinquency buckets with loan count and outstanding value.', frequency: 'On demand', exportFormat: 'CSV', autoSend: false, recipients: [] },
    { title: 'MDA collection performance analysis', description: 'Expected vs. actual deductions per employer/MDA.', frequency: 'Monthly', exportFormat: 'CSV', autoSend: true, recipients: ['partnerships@princepsfinance.com'] },
    { title: 'Collection officer activity report', description: 'Contacts made, promises logged, resolutions closed per officer.', frequency: 'Weekly', exportFormat: 'CSV', autoSend: false, recipients: [] },
    { title: 'Loan amount exception & leakage report', description: 'Revenue at risk from unresolved variances by channel.', frequency: 'Weekly', exportFormat: 'CSV', autoSend: true, recipients: ['revenue-assurance@princepsfinance.com'] },
    { title: 'Refund tracking summary', description: 'Refunds processed by channel — value and volume.', frequency: 'Monthly', exportFormat: 'CSV', autoSend: false, recipients: [] },
    { title: 'Middleware system log', description: 'Integration health and sync events across all channels.', frequency: 'On demand', exportFormat: 'CSV', autoSend: false, recipients: [] },
  ];

  readonly scheduling = signal<ReportDef | null>(null);
  readonly scheduleEmail = signal('');
  readonly scheduleCadence = signal<ReportFrequency>('Weekly');

  readonly cadenceOptions: SelectOption[] = [
    { value: 'Daily', label: 'Daily' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'On demand', label: 'On demand' },
  ];

  openSchedule(report: ReportDef) {
    this.scheduleEmail.set('');
    this.scheduleCadence.set(report.frequency);
    this.scheduling.set(report);
  }

  closeSchedule() {
    this.scheduling.set(null);
  }

  saveSchedule(report: ReportDef) {
    const email = this.scheduleEmail().trim();
    if (email) report.recipients.push(email);
    report.frequency = this.scheduleCadence();
    report.autoSend = true;
    this.scheduling.set(null);
  }

  exportReport(report: ReportDef) {
    const header = `Report,Frequency,Channel,Product,Status,Date range\n`;
    const row = `"${report.title}",${report.frequency},${this.channelFilter()},${this.productFilter()},${this.statusFilter()},${this.dateFrom()} to ${this.dateTo()}\n`;
    this.downloadCsv(header + row, report.title);
  }

  /** Generic CSV export for any table of rows — reused by every sub-report screen. */
  exportTableCsv(filename: string, headers: string[], rows: (string | number)[][]) {
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    this.downloadCsv(csv, filename);
  }

  private downloadCsv(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.exportHistory = [
      { date: new Date().toISOString().slice(0, 16).replace('T', ' '), type: filename, size: `${(Math.random() * 3 + 0.3).toFixed(1)} MB` },
      ...this.exportHistory,
    ];
  }

  /** PDF export via print-to-PDF — acceptable client-side approach per issue #7 (no PDF lib in package.json). */
  exportPdf(reportName: string) {
    document.title = reportName;
    window.print();
  }

  exportHistory: ExportRecord[] = [
    { date: '2026-07-03 14:20', type: 'Loan Performance', size: '2.4 MB' },
    { date: '2026-06-28 09:05', type: 'Collections Summary', size: '1.1 MB' },
    { date: '2026-06-20 16:42', type: 'Customer Growth', size: '3.8 MB' },
    { date: '2026-06-14 11:30', type: 'Wallet & Payouts', size: '860 KB' },
    { date: '2026-06-01 08:15', type: 'Product Mix', size: '1.6 MB' },
  ];

  openExportMenuDate: string | null = null;

  closeExportMenus() {
    this.openExportMenuDate = null;
  }
}
