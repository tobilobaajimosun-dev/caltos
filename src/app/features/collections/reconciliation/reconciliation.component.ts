import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
  ButtonComponent,
} from '../../../shared/components';

type VarianceState = 'matched' | 'underpaid' | 'overpaid' | 'missing';
type Channel = 'WACS' | 'Remita' | 'Dedukt' | 'IPPIS';

interface ScheduleMatchRow {
  reference: string;
  customer: { name: string; email: string };
  channel: Channel;
  expected: string;
  received: string;
  variance: VarianceState;
  date: string;
}

interface FailedDeductionReportRow {
  loanId: string;
  customer: { name: string; email: string };
  channel: Channel;
  amount: string;
  reason: string;
}

interface MdaPerformanceRow {
  mda: string;
  expected: string;
  actual: string;
  achievementRate: number;
  status: BadgeStatus;
}

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [
    KpiCardComponent,
    ColumnTitleComponent,
    TableItemComponent,
    StatusBadgeComponent,
    RoundTabsComponent,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reconciliation.component.html',
  styleUrl: './reconciliation.component.scss',
})
export class ReconciliationComponent {
  readonly tabs: Tab[] = [
    { label: 'Schedule Matching', value: 'matching' },
    { label: 'Monthly Summary', value: 'summary' },
    { label: 'Daily Failed Report', value: 'failed' },
    { label: 'MDA Performance', value: 'mda' },
  ];

  readonly activeTab = signal('matching');

  setTab(value: string) {
    this.activeTab.set(value);
  }

  readonly scheduleMatches: ScheduleMatchRow[] = [
    { reference: 'TRX-88213', customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, channel: 'WACS', expected: '₦25,000', received: '₦25,000', variance: 'matched', date: '2026-07-03' },
    { reference: 'TRX-88214', customer: { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' }, channel: 'Remita', expected: '₦4,250,000', received: '₦4,250,000', variance: 'matched', date: '2026-07-03' },
    { reference: 'TRX-88215', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, channel: 'Dedukt', expected: '₦2,500,750', received: '₦2,050,000', variance: 'underpaid', date: '2026-07-03' },
    { reference: 'TRX-88216', customer: { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' }, channel: 'IPPIS', expected: '₦75,000', received: '₦0', variance: 'missing', date: '2026-07-03' },
    { reference: 'TRX-88217', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, channel: 'Remita', expected: '₦120,000', received: '₦145,000', variance: 'overpaid', date: '2026-07-02' },
  ];

  varianceBadge(state: VarianceState): { status: BadgeStatus; label: string } {
    switch (state) {
      case 'matched': return { status: 'successful', label: 'Matched' };
      case 'underpaid': return { status: 'overdue', label: 'Underpaid' };
      case 'overpaid': return { status: 'pending', label: 'Overpaid' };
      case 'missing': return { status: 'failed', label: 'Missing' };
    }
  }

  readonly monthlySummary = {
    period: 'June 2026',
    generatedOn: '2026-07-01, 06:00 AM',
    totalExpected: '₦42,500,000',
    totalReceived: '₦37,697,500',
    variance: '-₦4,802,500',
    matchedCount: 1204,
    unmatchedCount: 18,
    recipients: ['finance@princepsfinance.com', 'ops@princepsfinance.com'],
  };

  readonly failedDeductionReport: FailedDeductionReportRow[] = [
    { loanId: 'LN-88213', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, channel: 'Remita', amount: '₦320,000', reason: 'Insufficient salary this cycle' },
    { loanId: 'LN-88190', customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, channel: 'Dedukt', amount: '₦210,000', reason: 'Mandate not linked to active account' },
    { loanId: 'LN-88104', customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, channel: 'IPPIS', amount: '₦95,000', reason: 'Payroll run delayed by MDA' },
  ];

  readonly mdaPerformance: MdaPerformanceRow[] = [
    { mda: 'Federal Ministry of Health', expected: '₦8,200,000', actual: '₦7,954,000', achievementRate: 97.0, status: 'active' },
    { mda: 'Federal Ministry of Education', expected: '₦6,100,000', actual: '₦5,124,000', achievementRate: 84.0, status: 'active' },
    { mda: 'Nigeria Police Force', expected: '₦11,400,000', actual: '₦9,006,000', achievementRate: 79.0, status: 'overdue' },
    { mda: 'Nigeria Customs Service', expected: '₦4,300,000', actual: '₦4,300,000', achievementRate: 100.0, status: 'active' },
  ];

  exportCsv() {
    const header = 'Loan ID,Customer,Channel,Amount,Reason\n';
    const rows = this.failedDeductionReport
      .map((r) => `${r.loanId},${r.customer.name},${r.channel},${r.amount},"${r.reason}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed-deductions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
