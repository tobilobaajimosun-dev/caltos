import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  KpiCardComponent,
  ProgressBarComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
} from '../../../shared/components';

interface RepaymentRow {
  installment: string;
  dueDate: string;
  amount: string;
  status: BadgeStatus;
}

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [RouterLink, KpiCardComponent, ProgressBarComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent],
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

  readonly schedule: RepaymentRow[] = [
    { installment: 'Installment 1', dueDate: '2026-05-30', amount: '₦25,000', status: 'successful' },
    { installment: 'Installment 2', dueDate: '2026-06-30', amount: '₦25,000', status: 'successful' },
    { installment: 'Installment 3', dueDate: '2026-06-30', amount: '₦25,000', status: 'successful' },
    { installment: 'Installment 4', dueDate: '2026-07-30', amount: '₦25,000', status: 'pending' },
    { installment: 'Installment 5', dueDate: '2026-08-30', amount: '₦25,000', status: 'pending' },
    { installment: 'Installment 6', dueDate: '2026-09-30', amount: '₦25,000', status: 'pending' },
  ];
}
