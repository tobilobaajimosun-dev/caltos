import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
} from '../../../shared/components';

interface ReconciliationRow {
  reference: string;
  customer: { name: string; email: string };
  amount: string;
  date: string;
  status: BadgeStatus;
}

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reconciliation.component.html',
  styleUrl: './reconciliation.component.scss',
})
export class ReconciliationComponent {
  readonly rows: ReconciliationRow[] = [
    { reference: 'TRX-88213', customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, amount: '₦25,000', date: '2026-07-03', status: 'successful' },
    { reference: 'TRX-88214', customer: { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' }, amount: '₦4,250,000', date: '2026-07-03', status: 'successful' },
    { reference: 'TRX-88215', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, amount: '₦2,500,750.50', date: '2026-07-03', status: 'pending' },
    { reference: 'TRX-88216', customer: { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' }, amount: '₦75,000', date: '2026-07-03', status: 'failed' },
  ];
}
