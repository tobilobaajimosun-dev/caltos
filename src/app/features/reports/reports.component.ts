import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ButtonComponent,
  TabsComponent,
  TabItem,
  RoundTabsComponent,
  Tab,
  ChartComponent,
  ChartDataPoint,
  ComingSoonComponent,
  DrawerComponent,
  SelectComponent,
  SelectOption,
  InputComponent,
} from '../../shared/components';

type ReportFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'On demand';
type ReportExportFormat = 'CSV' | 'CSV/Excel';

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
  menuOpen?: boolean;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ButtonComponent, TabsComponent, RoundTabsComponent, ChartComponent, ComingSoonComponent, DrawerComponent, SelectComponent, InputComponent],
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
    const blob = new Blob([header + row], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.exportHistory = [
      { date: new Date().toISOString().slice(0, 16).replace('T', ' '), type: report.title, size: `${(Math.random() * 3 + 0.3).toFixed(1)} MB` },
      ...this.exportHistory,
    ];
  }

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
