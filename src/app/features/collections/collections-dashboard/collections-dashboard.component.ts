import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KpiCardComponent,
  ChartComponent,
  ChartDataPoint,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
} from '../../../shared/components';

interface OverdueRow {
  customer: { name: string; email: string };
  product: string;
  daysOverdue: number;
  amount: string;
  status: BadgeStatus;
}

@Component({
  selector: 'app-collections-dashboard',
  standalone: true,
  imports: [KpiCardComponent, ChartComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collections-dashboard.component.html',
  styleUrl: './collections-dashboard.component.scss',
})
export class CollectionsDashboardComponent {
  readonly overdueByAge: ChartDataPoint[] = [
    { label: '1-7d', value: 32 }, { label: '8-14d', value: 21 }, { label: '15-30d', value: 14 },
    { label: '31-60d', value: 9 }, { label: '60d+', value: 5 },
  ];

  readonly topOverdue: OverdueRow[] = [
    { customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, product: 'Credit Wallet', daysOverdue: 42, amount: '₦320,000', status: 'overdue' },
    { customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, product: 'Salary Advance', daysOverdue: 30, amount: '₦210,000', status: 'overdue' },
    { customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, product: 'Corper Wallet', daysOverdue: 18, amount: '₦95,000', status: 'overdue' },
    { customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, product: 'Credit Lite', daysOverdue: 9, amount: '₦45,000', status: 'overdue' },
  ];
}
