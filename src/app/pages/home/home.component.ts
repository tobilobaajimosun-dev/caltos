import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StatusBadgeComponent, AvatarComponent, ProgressBarComponent, TabsComponent, TabItem, ButtonComponent, EmptyStateComponent } from '../../shared/components';
import { AccountService } from '../../shared/services/account.service';
import { ProductsService } from '../../shared/services/products.service';

type BadgeStatus = 'active'|'inactive'|'suspended'|'pending'|'overdue'|'dormant'|'successful'|'failed';

interface ActivityEntry {
  icon: string;
  text: string;
  at: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, AvatarComponent, ProgressBarComponent, TabsComponent, ButtonComponent, EmptyStateComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  readonly account = inject(AccountService);
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  activePeriod = 'today';

  readonly hasProducts = computed(() => this.productsService.products().length > 0);

  readonly quickActions = [
    { icon: '➕', title: 'Create product', desc: 'Launch a new loan or BNPL product.', route: '/products/create' },
    { icon: '📋', title: 'View applications', desc: 'Review the loan processing pipeline.', route: '/loans/processing' },
    { icon: '📊', title: 'View reports', desc: 'Portfolio performance and exports.', route: '/reports' },
  ];

  readonly recentActivity = computed<ActivityEntry[]>(() => {
    const products = this.productsService.products();
    const entries: ActivityEntry[] = [];
    for (const p of products) {
      entries.push({ icon: '🆕', text: `"${p.name}" was created`, at: p.createdAt });
      if (p.status === 'live') entries.push({ icon: '✅', text: `"${p.name}" was published`, at: p.createdAt });
      if (p.stats.totalApplications > 0) entries.push({ icon: '📝', text: `${p.stats.totalApplications} application${p.stats.totalApplications === 1 ? '' : 's'} received for "${p.name}"`, at: p.createdAt });
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
      sparkPoints: '0,32 12,24 24,20 36,16 48,10 60,6 72,2',
      count: 100,
    },
    {
      label: 'Loans Disbursed',
      amount: '₦82,756,352.10',
      trend: { dir: 'down' as const, value: 40 },
      trendColor: '#e03e3e',
      sparkPoints: '0,2 12,6 24,12 36,16 48,22 60,28 72,32',
      count: 46,
    },
    {
      label: 'Applications in Review',
      amount: '₦2,756,352.10',
      trend: null,
      trendColor: '',
      sparkPoints: '',
      count: 4,
    },
    {
      label: 'New Applications',
      amount: '₦2,756,352.10',
      trend: null,
      trendColor: '',
      sparkPoints: '',
      count: 26,
    },
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
