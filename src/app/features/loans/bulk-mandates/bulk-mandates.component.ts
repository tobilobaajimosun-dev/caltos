import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  AlertBannerComponent,
  BadgeStatus,
} from '../../../shared/components';

interface MandateRow {
  customer: { name: string; email: string };
  bank: string;
  amount: string;
  status: BadgeStatus;
}

@Component({
  selector: 'app-bulk-mandates',
  standalone: true,
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent, AlertBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bulk-mandates.component.html',
  styleUrl: './bulk-mandates.component.scss',
})
export class BulkMandatesComponent {
  readonly rows: MandateRow[] = [
    { customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, bank: 'GTBank', amount: '₦150,000', status: 'successful' },
    { customer: { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' }, bank: 'Access Bank', amount: '₦75,000', status: 'successful' },
    { customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, bank: 'Zenith Bank', amount: '₦320,000', status: 'failed' },
    { customer: { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' }, bank: 'UBA', amount: '₦45,000', status: 'pending' },
  ];
}
