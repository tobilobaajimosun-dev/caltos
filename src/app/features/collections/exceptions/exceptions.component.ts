import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
} from '../../../shared/components';

interface ExceptionRow {
  customer: { name: string; email: string };
  reason: string;
  amount: string;
  flaggedOn: string;
  status: BadgeStatus;
}

@Component({
  selector: 'app-exceptions',
  standalone: true,
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exceptions.component.html',
  styleUrl: './exceptions.component.scss',
})
export class ExceptionsComponent {
  readonly rows: ExceptionRow[] = [
    { customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, reason: 'Duplicate repayment', amount: '₦25,000', flaggedOn: '2026-07-02', status: 'pending' },
    { customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, reason: 'Amount mismatch', amount: '₦12,500', flaggedOn: '2026-07-01', status: 'pending' },
    { customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, reason: 'Unrecognized sender', amount: '₦40,000', flaggedOn: '2026-06-29', status: 'successful' },
  ];
}
