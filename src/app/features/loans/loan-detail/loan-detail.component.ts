import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  KpiCardComponent,
  ProgressBarComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
} from '../../../shared/components';
import { RefundsComponent } from '../refunds/refunds.component';

type DetailTab = 'overview' | 'repayments' | 'refunds' | 'activity';

interface RepaymentRow {
  installment: string;
  dueDate: string;
  amount: string;
  status: BadgeStatus;
}

interface ActivityEvent {
  at: string;
  event: string;
}

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [
    KpiCardComponent, ProgressBarComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent,
    RoundTabsComponent, RefundsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-detail.component.html',
  styleUrl: './loan-detail.component.scss',
})
export class LoanDetailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly loanId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly customerName = 'Akpan Akporigomayen';
  readonly product = 'Salary Advance Loan';
  readonly principal = '₦150,000';
  readonly outstanding = '₦62,500';
  readonly nextDueDate = '2026-07-30';
  readonly repaidPct = 58;
  readonly disbursedDate = '2026-04-30';
  readonly channel = 'Remita';
  readonly status: BadgeStatus = 'active';

  readonly tabs: Tab[] = [
    { label: 'Overview', value: 'overview' },
    { label: 'Repayments', value: 'repayments' },
    { label: 'Refunds', value: 'refunds' },
    { label: 'Activity', value: 'activity' },
  ];

  readonly activeTab = signal<DetailTab>('overview');
  setTab(value: string) {
    this.activeTab.set(value as DetailTab);
  }

  readonly schedule: RepaymentRow[] = [
    { installment: 'Installment 1', dueDate: '2026-05-30', amount: '₦25,000', status: 'successful' },
    { installment: 'Installment 2', dueDate: '2026-06-30', amount: '₦25,000', status: 'successful' },
    { installment: 'Installment 3', dueDate: '2026-06-30', amount: '₦25,000', status: 'successful' },
    { installment: 'Installment 4', dueDate: '2026-07-30', amount: '₦25,000', status: 'pending' },
    { installment: 'Installment 5', dueDate: '2026-08-30', amount: '₦25,000', status: 'pending' },
    { installment: 'Installment 6', dueDate: '2026-09-30', amount: '₦25,000', status: 'pending' },
  ];

  readonly activity: ActivityEvent[] = [
    { at: '2026-04-30 09:12', event: 'Loan disbursed — ₦150,000 to salary account' },
    { at: '2026-04-30 09:12', event: 'Remita mandate activated' },
    { at: '2026-05-30 06:00', event: 'Installment 1 collected — ₦25,000' },
    { at: '2026-06-30 06:00', event: 'Installment 2 collected — ₦25,000' },
    { at: '2026-06-30 06:05', event: 'Installment 3 collected — ₦25,000' },
    { at: '2026-07-05 08:00', event: 'Status updated to Active' },
  ];
}
