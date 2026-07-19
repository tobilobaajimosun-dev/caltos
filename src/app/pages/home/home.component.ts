import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  StatusBadgeComponent,
  AvatarComponent,
  ProgressBarComponent,
  TabsComponent,
  TabItem,
  ButtonComponent,
  EmptyStateComponent,
  KpiCardComponent,
  ChartComponent,
  ChartDataPoint,
  AlertBannerComponent,
  ConfirmModalComponent,
  SkeletonComponent,
  IconData,
} from '../../shared/components';
import { HiIconComponent } from '../../shared/components/hi-icon/hi-icon.component';
import {
  PlusSignIcon,
  FileValidationIcon,
  ChartIcon,
  NewReleasesIcon,
  CheckmarkCircle02Icon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons';
import { AccountService } from '../../shared/services/account.service';
import { ProductsService } from '../../shared/services/products.service';

type BadgeStatus = 'active'|'inactive'|'suspended'|'pending'|'overdue'|'dormant'|'successful'|'failed';

interface ActivityEntry {
  icon: IconData;
  text: string;
  at: string;
}

type DashboardState = 'loading' | 'ready' | 'empty' | 'error';

type ChartPeriod = '1W' | '1M' | '3M' | '6M' | '1Y';

interface PendingApproval {
  id: string;
  name: string;
  product: string;
  amount: string;
  daysInQueue: number;
}

interface TopProduct {
  name: string;
  activeLoans: number;
  totalDisbursed: string;
  collectionRate: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    StatusBadgeComponent,
    AvatarComponent,
    ProgressBarComponent,
    TabsComponent,
    ButtonComponent,
    EmptyStateComponent,
    KpiCardComponent,
    ChartComponent,
    AlertBannerComponent,
    ConfirmModalComponent,
    SkeletonComponent,
    HiIconComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  readonly account = inject(AccountService);
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  activePeriod = 'today';

  readonly hasProducts = computed(() => this.productsService.products().length > 0);

  /** Frontend-only demo state toggle — no real API, so a signal is enough. */
  readonly dashboardState = signal<DashboardState>('ready');

  setState(state: DashboardState) {
    this.dashboardState.set(state);
  }

  retry() {
    this.dashboardState.set('loading');
    setTimeout(() => this.dashboardState.set('ready'), 600);
  }

  readonly quickActions: { icon: IconData; title: string; desc: string; route: string }[] = [
    { icon: PlusSignIcon as IconData, title: 'Create product', desc: 'Launch a new loan or BNPL product.', route: '/products/create' },
    { icon: FileValidationIcon as IconData, title: 'View applications', desc: 'Review the loan processing pipeline.', route: '/loans/processing' },
    { icon: ChartIcon as IconData, title: 'View reports', desc: 'Portfolio performance and exports.', route: '/reports' },
  ];

  readonly recentActivity = computed<ActivityEntry[]>(() => {
    const products = this.productsService.products();
    const entries: ActivityEntry[] = [];
    for (const p of products) {
      entries.push({ icon: NewReleasesIcon as IconData, text: `"${p.name}" was created`, at: p.createdAt });
      if (p.status === 'live') entries.push({ icon: CheckmarkCircle02Icon as IconData, text: `"${p.name}" was published`, at: p.createdAt });
      if (p.stats.totalApplications > 0) entries.push({ icon: PencilEdit02Icon as IconData, text: `${p.stats.totalApplications} application${p.stats.totalApplications === 1 ? '' : 's'} received for "${p.name}"`, at: p.createdAt });
    }
    return entries.slice(0, 5);
  });

  goTo(route: string) {
    this.router.navigateByUrl(route);
  }

  readonly periodTabs: TabItem[] = [
    { id: 'today',     label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week',      label: 'This Week' },
    { id: 'month',     label: 'This Month' },
    { id: 'custom',    label: 'Custom' },
  ];

  readonly disbursementTrend = [
    { date: 'Jul 9',  amount: '₦1,240,000', x: 0,   y: 200 },
    { date: 'Jul 10', amount: '₦1,680,000', x: 150, y: 178 },
    { date: 'Jul 11', amount: '₦2,410,000', x: 280, y: 128 },
    { date: 'Jul 12', amount: '₦2,980,000', x: 410, y: 84  },
    { date: 'Jul 13', amount: '₦3,520,000', x: 540, y: 36  },
    { date: 'Jul 14', amount: '₦3,934,199', x: 650, y: 4   },
  ];

  readonly metrics = [
    {
      label: 'Total Loan Applications',
      amount: '₦182,756,352.10',
      trend: { dir: 'up' as const, value: 40 },
      trendColor: '#059669',
      sparkData: [42, 48, 45, 54, 51, 62, 59, 68, 74],
      count: 100,
    },
    {
      label: 'Loans Disbursed',
      amount: '₦82,756,352.10',
      trend: { dir: 'down' as const, value: 40 },
      trendColor: '#e03e3e',
      sparkData: [76, 71, 74, 64, 66, 55, 50, 44, 38],
      count: 46,
    },
    {
      label: 'Applications in Review',
      amount: '₦2,756,352.10',
      trend: null,
      trendColor: '',
      sparkData: [] as number[],
      count: 4,
    },
    {
      label: 'New Applications',
      amount: '₦2,756,352.10',
      trend: null,
      trendColor: '',
      sparkData: [] as number[],
      count: 26,
    },
  ];

  // ── Issue #1 KPI Row: 5 specific dashboard KPIs ──
  readonly overdueLoanCount = 14;
  readonly overdueAtRiskAmount = '₦2.3M';
  readonly totalBookSize = 612;

  readonly overduePercentOfBook = computed(() => {
    const pct = (this.overdueLoanCount / this.totalBookSize) * 100;
    return pct.toFixed(1);
  });

  readonly hasOverdueLoans = computed(() => this.overdueLoanCount > 0);

  // Values kept single-line so the row stays height-aligned; deltas go in trend chips.
  readonly kpiCards = [
    { label: 'Total Portfolio Value', value: '₦412,680,000', trend: null as { dir: 'up' | 'down'; value: number } | null },
    { label: 'Disbursed Today', value: '₦18,240,000', trend: { dir: 'up' as const, value: 12 } },
    { label: 'Repayments Due (7 days)', value: '₦64.5M · 231 loans', trend: null },
    { label: 'Overdue Loans', value: '14 · 2.3% of book', trend: null },
    { label: 'Collections Rate (30d)', value: '94.6%', trend: null },
  ];

  // ── Loan Activity Chart ──
  readonly chartPeriodTabs: TabItem[] = [
    { id: '1W', label: '1W' },
    { id: '1M', label: '1M' },
    { id: '3M', label: '3M' },
    { id: '6M', label: '6M' },
    { id: '1Y', label: '1Y' },
  ];

  readonly chartActivePeriod = signal<ChartPeriod>('1M');

  setChartPeriod(period: string) {
    this.chartActivePeriod.set(period as ChartPeriod);
  }

  private readonly disbursementSeries: Record<ChartPeriod, ChartDataPoint[]> = {
    '1W': [
      { label: 'Mon', value: 12 }, { label: 'Tue', value: 18 }, { label: 'Wed', value: 15 },
      { label: 'Thu', value: 22 }, { label: 'Fri', value: 28 }, { label: 'Sat', value: 14 }, { label: 'Sun', value: 9 },
    ],
    '1M': [
      { label: 'Wk 1', value: 62 }, { label: 'Wk 2', value: 74 }, { label: 'Wk 3', value: 58 }, { label: 'Wk 4', value: 91 },
    ],
    '3M': [
      { label: 'May', value: 210 }, { label: 'Jun', value: 264 }, { label: 'Jul', value: 298 },
    ],
    '6M': [
      { label: 'Feb', value: 180 }, { label: 'Mar', value: 205 }, { label: 'Apr', value: 190 },
      { label: 'May', value: 210 }, { label: 'Jun', value: 264 }, { label: 'Jul', value: 298 },
    ],
    '1Y': [
      { label: 'Aug', value: 140 }, { label: 'Sep', value: 155 }, { label: 'Oct', value: 168 }, { label: 'Nov', value: 172 },
      { label: 'Dec', value: 190 }, { label: 'Jan', value: 176 }, { label: 'Feb', value: 180 }, { label: 'Mar', value: 205 },
      { label: 'Apr', value: 190 }, { label: 'May', value: 210 }, { label: 'Jun', value: 264 }, { label: 'Jul', value: 298 },
    ],
  };

  private readonly repaymentSeries: Record<ChartPeriod, ChartDataPoint[]> = {
    '1W': [
      { label: 'Mon', value: 9 }, { label: 'Tue', value: 14 }, { label: 'Wed', value: 12 },
      { label: 'Thu', value: 18 }, { label: 'Fri', value: 21 }, { label: 'Sat', value: 11 }, { label: 'Sun', value: 7 },
    ],
    '1M': [
      { label: 'Wk 1', value: 48 }, { label: 'Wk 2', value: 55 }, { label: 'Wk 3', value: 49 }, { label: 'Wk 4', value: 70 },
    ],
    '3M': [
      { label: 'May', value: 168 }, { label: 'Jun', value: 202 }, { label: 'Jul', value: 231 },
    ],
    '6M': [
      { label: 'Feb', value: 140 }, { label: 'Mar', value: 158 }, { label: 'Apr', value: 149 },
      { label: 'May', value: 168 }, { label: 'Jun', value: 202 }, { label: 'Jul', value: 231 },
    ],
    '1Y': [
      { label: 'Aug', value: 110 }, { label: 'Sep', value: 118 }, { label: 'Oct', value: 130 }, { label: 'Nov', value: 135 },
      { label: 'Dec', value: 148 }, { label: 'Jan', value: 139 }, { label: 'Feb', value: 140 }, { label: 'Mar', value: 158 },
      { label: 'Apr', value: 149 }, { label: 'May', value: 168 }, { label: 'Jun', value: 202 }, { label: 'Jul', value: 231 },
    ],
  };

  readonly disbursementChartData = computed(() => this.disbursementSeries[this.chartActivePeriod()]);
  readonly repaymentChartData = computed(() => this.repaymentSeries[this.chartActivePeriod()]);

  readonly chartSummary = {
    avgLoanSize: '₦462,000',
    avgTenor: '4.2 months',
    avgInterestRate: '3.8% / month',
  };

  // ── Pending Approvals Panel ──
  readonly pendingApprovals = signal<PendingApproval[]>([
    { id: 'LN-3391', name: 'Ifeoma Chukwu',  product: 'Credit Wallet', amount: '₦850,000',   daysInQueue: 1 },
    { id: 'LN-3388', name: 'Tunde Bakare',    product: 'Credit Lite',   amount: '₦320,000',   daysInQueue: 2 },
    { id: 'LN-3379', name: 'Grace Adeyemi',   product: 'Corper Wallet', amount: '₦1,200,000', daysInQueue: 3 },
    { id: 'LN-3364', name: 'Musa Ibrahim',    product: 'Credit Wallet', amount: '₦540,000',   daysInQueue: 5 },
  ]);

  readonly approvalModalOpen = signal(false);
  readonly approvalModalAction = signal<'approve' | 'reject'>('approve');
  readonly approvalTarget = signal<PendingApproval | null>(null);

  readonly approvalModalTitle = computed(() =>
    this.approvalModalAction() === 'approve' ? 'Approve loan?' : 'Reject loan?'
  );

  readonly approvalModalMessage = computed(() => {
    const target = this.approvalTarget();
    if (!target) return '';
    return this.approvalModalAction() === 'approve'
      ? `Approve ${target.amount} for ${target.name} (${target.product})? This will move the loan to disbursement.`
      : `Reject the ${target.amount} application from ${target.name} (${target.product})? This cannot be undone.`;
  });

  requestApproval(item: PendingApproval, action: 'approve' | 'reject') {
    this.approvalTarget.set(item);
    this.approvalModalAction.set(action);
    this.approvalModalOpen.set(true);
  }

  confirmApproval() {
    const target = this.approvalTarget();
    if (target) {
      this.pendingApprovals.update((list) => list.filter((a) => a.id !== target.id));
    }
    this.approvalModalOpen.set(false);
    this.approvalTarget.set(null);
  }

  cancelApproval() {
    this.approvalModalOpen.set(false);
    this.approvalTarget.set(null);
  }

  // ── Top Performing Products ──
  readonly topPerformingProducts: TopProduct[] = [
    { name: 'Credit Wallet',  activeLoans: 312, totalDisbursed: '₦186,400,000', collectionRate: 96.2 },
    { name: 'Credit Lite',    activeLoans: 204, totalDisbursed: '₦98,750,000',  collectionRate: 93.4 },
    { name: 'Corper Wallet',  activeLoans: 96,  totalDisbursed: '₦127,530,000', collectionRate: 91.8 },
  ];

  readonly payoutActivity: Array<{ initials: string; name: string; id: string; amount: string; status: BadgeStatus; statusLabel: string }> = [
    { initials: 'AA', name: 'Akpan Akporigomayen', id: 'CW1122617-01', amount: '₦3,934,199.13', status: 'successful', statusLabel: 'Successful' },
    { initials: 'BA', name: 'Bola Adebayo',        id: 'CW1122617-02', amount: '₦4,250,000.00', status: 'pending',    statusLabel: 'Processing' },
    { initials: 'CO', name: 'Chika Okafor',        id: 'CW1122617-03', amount: '₦2,500,750.50', status: 'failed',     statusLabel: 'Failed'     },
    { initials: 'DO', name: 'Damilola Ojo',        id: 'CW1122617-04', amount: '₦2,500,750.50', status: 'failed',     statusLabel: 'Failed'     },
    { initials: 'EN', name: 'Emeka Nwosu',         id: 'CW1122617-05', amount: '₦4,250,000.00', status: 'pending',    statusLabel: 'Processing' },
  ];

  readonly siteVisits = [
    { product: 'Corper Wallet', updated: 'Last Updated: 2:38PM', count: 300, trend: 'up',   sparkPoints: '0,22 16,18 32,12 48,14 64,8 80,4' },
    { product: 'Credit Wallet', updated: 'Last Updated: 2:38PM', count: 30,  trend: 'down', sparkPoints: '0,4 16,8 32,12 48,16 64,20 80,24'  },
    { product: 'Credit Wallet', updated: 'Last Updated: 2:38PM', count: 30,  trend: 'down', sparkPoints: '0,4 16,10 32,14 48,16 64,20 80,24' },
    { product: 'Credit Wallet', updated: 'Last Updated: 2:38PM', count: 30,  trend: 'down', sparkPoints: '0,6 16,10 32,14 48,18 64,22 80,24' },
  ];

  readonly disbursedByProduct = [
    { name: 'Credit Wallet', trend: { dir: 'up',   value: 40 }, amount: '₦6,754,100.20', pct: 90, color: '#0053a6' },
    { name: 'Credit Lite',   trend: { dir: 'up',   value: 40 }, amount: '₦6,754,100.20', pct: 65, color: '#e03e3e' },
    { name: 'Credit Wallet', trend: { dir: 'down', value: 4  }, amount: '₦6,754,100.20', pct: 38, color: '#8b5cf6' },
    { name: 'Credit Wallet', trend: null,                        amount: '₦6,754,100.20', pct: 96, color: '#f59e0b' },
  ];

  readonly loggedRepayments = [
    { product: 'Credit Lite',   updated: 'Last Updated: 2:38PM', count: 300, color: '#0053a6' },
    { product: 'Credit Wallet', updated: 'Last Updated: 2:38PM', count: 300, color: '#e03e3e' },
    { product: 'Corper Wallet', updated: 'Last Updated: 2:38PM', count: 300, color: '#f59e0b' },
  ];

  readonly repaymentHistory: Array<{ initials: string; name: string; id: string; amount: string; time: string }> = [
    { initials: 'AA', name: 'Akpan Akporigomayen', id: 'CW1122617-01', amount: '₦3,934,199.13', time: '2:38PM' },
    { initials: 'BA', name: 'Bola Adebayo',        id: 'CW1122617-02', amount: '₦4,250,000.00', time: '2:38PM' },
    { initials: 'CO', name: 'Chika Okafor',        id: 'CW1122617-03', amount: '₦2,500,750.50', time: '2:38PM' },
    { initials: 'DO', name: 'Damilola Ojo',        id: 'CW1122617-04', amount: '₦5,120,300.00', time: '2:38PM' },
    { initials: 'EN', name: 'Emeka Nwosu',         id: 'CW1122617-05', amount: '₦6,754,100.20', time: '2:38PM' },
    { initials: 'FA', name: 'Fatima Abdallah',     id: 'CW1122617-06', amount: '₦4,900,450.40', time: '2:38PM' },
    { initials: 'GM', name: 'Gideon Mbogo',        id: 'CW1122617-07', amount: '₦3,150,900.00', time: '2:38PM' },
  ];
}
