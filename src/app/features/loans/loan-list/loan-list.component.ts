import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  KpiCardComponent,
  ChartComponent,
  ChartDataPoint,
  ColumnTitleComponent,
  TableItemComponent,
  TableItemUser,
  BadgeStatus,
} from '../../../shared/components';

interface LoanRow {
  id: string;
  customer: TableItemUser;
  product: string;
  amount: string;
  status: BadgeStatus;
  dueDate: string;
}

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [RouterLink, KpiCardComponent, ChartComponent, ColumnTitleComponent, TableItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-list.component.html',
  styleUrl: './loan-list.component.scss',
})
export class LoanListComponent {
  readonly disbursementTrend: ChartDataPoint[] = [
    { label: 'Mon', value: 12 }, { label: 'Tue', value: 18 }, { label: 'Wed', value: 14 },
    { label: 'Thu', value: 22 }, { label: 'Fri', value: 19 }, { label: 'Sat', value: 9 }, { label: 'Sun', value: 15 },
  ];

  readonly loans: LoanRow[] = [
    { id: 'LN-202406-001', customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, product: 'Salary Advance', amount: '₦150,000', status: 'active', dueDate: '2026-07-30' },
    { id: 'LN-202406-002', customer: { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' }, product: 'Corper Wallet', amount: '₦75,000', status: 'pending', dueDate: '2026-08-02' },
    { id: 'LN-202406-003', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, product: 'Credit Wallet', amount: '₦320,000', status: 'overdue', dueDate: '2026-06-18' },
    { id: 'LN-202406-004', customer: { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' }, product: 'Credit Lite', amount: '₦45,000', status: 'active', dueDate: '2026-07-25' },
    { id: 'LN-202406-005', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, product: 'Salary Advance', amount: '₦210,000', status: 'suspended', dueDate: '2026-07-10' },
  ];
}
