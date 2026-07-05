import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ButtonComponent,
  TabsComponent,
  TabItem,
  RoundTabsComponent,
  Tab,
  ChartComponent,
  ChartDataPoint,
  ComingSoonComponent,
} from '../../shared/components';

interface ReportDef {
  title: string;
  description: string;
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
  menuOpen?: boolean;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ButtonComponent, TabsComponent, RoundTabsComponent, ChartComponent, ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  host: { '(document:click)': 'closeExportMenus()' },
})
export class ReportsComponent {
  mainTab: 'report' | 'export' = 'report';

  readonly reportSubTabs: Tab[] = [
    { label: 'Portfolio Overview', value: 'overview' },
    { label: 'Loan Products', value: 'products' },
    { label: 'Referral', value: 'referral' },
    { label: 'Customers', value: 'customers' },
  ];
  reportSubTab = 'overview';

  readonly periodTabs: TabItem[] = [
    { id: 'today',     label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week',      label: 'This Week' },
    { id: 'month',     label: 'This Month' },
    { id: 'custom',    label: 'Custom' },
  ];
  activePeriod = 'today';

  readonly kpis: MetricCard[] = [
    { label: 'Total Loans Issued',     amount: '₦1,797,120,000', trend: { dir: 'up',   value: 40 },  trendColor: '#059669', countLabel: 'In Count',           countVal: '3,240' },
    { label: 'Total Repaid',           amount: '₦1,797,120,000', trend: { dir: 'up',   value: 40 },  trendColor: '#059669', countLabel: 'Repayment Rate',     countVal: '74.9%' },
    { label: 'Outstanding Balance',    amount: '₦620,000,000',   trend: { dir: 'up',   value: 40 },  trendColor: '#f59e0b', countLabel: 'Active Loans',       countVal: '1,840' },
    { label: 'Default Rate',          amount: '4.8%',            trend: { dir: 'down', value: 0.6 }, trendColor: '#e03e3e', countLabel: 'Defaulted Loans',    countVal: '156' },
    { label: 'Applications Submitted', amount: '4,210',          trend: { dir: 'up',   value: 23 },  trendColor: '#059669', countLabel: 'In Count',           countVal: '4,310' },
    { label: 'Approval Rate',         amount: '77%',             trend: { dir: 'up',   value: 40 },  trendColor: '#059669', countLabel: 'Approved',           countVal: '3,240' },
    { label: 'Avg Approval Time',     amount: '3.5m',            trend: { dir: 'up',   value: 40 },  trendColor: '#f59e0b', countLabel: 'Submit → Disburse',  countVal: '--' },
    { label: 'PAR 30',                amount: '8.2%',            trend: { dir: 'down', value: 0.6 }, trendColor: '#e03e3e', countLabel: 'Loans > 30 days overdue', countVal: '268' },
  ];

  readonly lendingTrend: ChartDataPoint[] = [
    { label: 'Jan', value: 12 }, { label: 'Feb', value: 18 }, { label: 'Mar', value: 15 },
    { label: 'Apr', value: 24 }, { label: 'May', value: 20 }, { label: 'Jun', value: 28 },
  ];

  readonly loanStatusSplit = [
    { label: 'Repaid',  count: 1847, pct: 57, color: '#059669' },
    { label: 'Active',  count: 648,  pct: 20, color: '#0053a6' },
    { label: 'Overdue', count: 320,  pct: 10, color: '#f59e0b' },
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

  readonly reports: ReportDef[] = [
    { title: 'Loan Performance', description: 'Disbursements, repayments, and default rates by product.' },
    { title: 'Collections Summary', description: 'Overdue accounts, recovery rates, and aging analysis.' },
    { title: 'Customer Growth', description: 'New applications, approvals, and customer retention.' },
    { title: 'Wallet & Payouts', description: 'Wallet funding, disbursement volume, and payout activity.' },
    { title: 'Product Mix', description: 'Portfolio breakdown by loan product and channel.' },
    { title: 'Compliance & Audit', description: 'KYC completion, document verification, and audit trail exports.' },
  ];

  exportHistory: ExportRecord[] = [
    { date: '2026-07-03 14:20', type: 'Loan Performance', size: '2.4 MB' },
    { date: '2026-06-28 09:05', type: 'Collections Summary', size: '1.1 MB' },
    { date: '2026-06-20 16:42', type: 'Customer Growth', size: '3.8 MB' },
    { date: '2026-06-14 11:30', type: 'Wallet & Payouts', size: '860 KB' },
    { date: '2026-06-01 08:15', type: 'Product Mix', size: '1.6 MB' },
  ];

  toggleExportMenu(event: Event, record: ExportRecord) {
    event.stopPropagation();
    const wasOpen = record.menuOpen;
    this.exportHistory.forEach((r) => (r.menuOpen = false));
    record.menuOpen = !wasOpen;
  }

  closeExportMenus() {
    this.exportHistory.forEach((r) => (r.menuOpen = false));
  }
}
