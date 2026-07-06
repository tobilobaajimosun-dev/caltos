import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DecimalPipe, KeyValuePipe } from '@angular/common';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  TabsComponent,
  TabItem,
  ButtonComponent,
  ProgressBarComponent,
} from '../../../shared/components';

type Channel = 'IPPIS' | 'Remita' | 'Dedukt' | 'WACS' | 'Direct Debit';
type Period = 'today' | 'week' | 'month';

interface ChannelTile {
  channel: Channel;
  expected: number;
  collected: number;
  lastDeduction: string;
  successRate: number;
}

interface DelinquencyBucket {
  label: string;
  loanCount: number;
  outstanding: number;
  channelBreakdown: Partial<Record<Channel, number>>;
}

interface FailedDeduction {
  loanId: string;
  borrower: { name: string; email: string };
  channel: Channel;
  amount: string;
  reason: string;
  resolved?: 'retried' | 'escalated' | 'written-off';
}

interface PipelineStage {
  bucket: string;
  count: number;
  officer: string;
}

@Component({
  selector: 'app-collections-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    KeyValuePipe,
    KpiCardComponent,
    ColumnTitleComponent,
    TableItemComponent,
    StatusBadgeComponent,
    TabsComponent,
    ButtonComponent,
    ProgressBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collections-dashboard.component.html',
  styleUrl: './collections-dashboard.component.scss',
})
export class CollectionsDashboardComponent {
  readonly periodTabs: TabItem[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  readonly period = signal<Period>('month');

  // Base figures per period — scaled for the demo rather than modeled precisely.
  private readonly periodScale: Record<Period, number> = { today: 0.05, week: 0.28, month: 1 };

  private readonly baseExpected = 42_500_000;
  private readonly baseFailureRate = 8.4;

  readonly totalExpected = computed(() => this.baseExpected * this.periodScale[this.period()]);
  readonly totalCollected = computed(() => this.totalExpected() * 0.887);
  readonly variancePct = computed(() => (((this.totalCollected() - this.totalExpected()) / this.totalExpected()) * 100));
  readonly failureRate = computed(() => this.baseFailureRate + (this.period() === 'today' ? 1.6 : this.period() === 'week' ? 0.4 : 0));

  readonly channelTiles: ChannelTile[] = [
    { channel: 'IPPIS', expected: 14_200_000, collected: 13_540_000, lastDeduction: 'Today, 6:02 AM', successRate: 95.3 },
    { channel: 'Remita', expected: 11_800_000, collected: 10_120_000, lastDeduction: 'Today, 5:47 AM', successRate: 85.8 },
    { channel: 'Dedukt', expected: 6_400_000, collected: 5_120_000, lastDeduction: 'Yesterday, 11:58 PM', successRate: 80.0 },
    { channel: 'WACS', expected: 7_100_000, collected: 6_745_000, lastDeduction: 'Today, 6:15 AM', successRate: 95.0 },
    { channel: 'Direct Debit', expected: 3_000_000, collected: 2_145_000, lastDeduction: 'Today, 4:30 AM', successRate: 71.5 },
  ];

  readonly delinquencyBuckets: DelinquencyBucket[] = [
    { label: '1–30 days', loanCount: 214, outstanding: 38_600_000, channelBreakdown: { IPPIS: 60, Remita: 90, Dedukt: 40, WACS: 24 } },
    { label: '31–60 days', loanCount: 96, outstanding: 21_400_000, channelBreakdown: { IPPIS: 20, Remita: 44, Dedukt: 22, WACS: 10 } },
    { label: '61–90 days', loanCount: 41, outstanding: 12_050_000, channelBreakdown: { Remita: 21, Dedukt: 14, WACS: 6 } },
    { label: '90+ days', loanCount: 23, outstanding: 9_300_000, channelBreakdown: { Remita: 11, Dedukt: 12 } },
  ];

  readonly failedDeductions: FailedDeduction[] = [
    { loanId: 'LN-88213', borrower: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, channel: 'Remita', amount: '₦320,000', reason: 'Insufficient salary this cycle' },
    { loanId: 'LN-88190', borrower: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, channel: 'Dedukt', amount: '₦210,000', reason: 'Mandate not linked to active account' },
    { loanId: 'LN-88104', borrower: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, channel: 'IPPIS', amount: '₦95,000', reason: 'Payroll run delayed by MDA' },
    { loanId: 'LN-88077', borrower: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, channel: 'WACS', amount: '₦45,000', reason: 'Deduction omitted from batch file' },
    { loanId: 'LN-88052', borrower: { name: 'Ronke Balogun', email: 'ronke@princepsfinance.com' }, channel: 'Direct Debit', amount: '₦150,000', reason: 'Card expired' },
  ];

  readonly pipeline: PipelineStage[] = [
    { bucket: '1–30 days', count: 214, officer: 'Unassigned queue' },
    { bucket: '31–60 days', count: 96, officer: 'T. Adeyemi' },
    { bucket: '61–90 days', count: 41, officer: 'B. Nwachukwu' },
    { bucket: '90+ days', count: 23, officer: 'Escalated — Legal' },
  ];

  readonly maxPipelineCount = this.pipeline[0].count;

  channelBadgeStatus(reason: string): BadgeStatus {
    return reason.includes('expired') || reason.includes('omitted') ? 'failed' : 'overdue';
  }

  resolve(row: FailedDeduction, action: 'retried' | 'escalated' | 'written-off') {
    row.resolved = action;
  }

  setPeriod(id: string) {
    this.period.set(id as Period);
  }
}
