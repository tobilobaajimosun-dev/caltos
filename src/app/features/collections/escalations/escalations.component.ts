import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
} from '../../../shared/components';

interface EscalationRow {
  customer: { name: string; email: string };
  stage: string;
  amount: string;
  assignedTo: string;
  status: BadgeStatus;
}

@Component({
  selector: 'app-escalations',
  standalone: true,
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './escalations.component.html',
  styleUrl: './escalations.component.scss',
})
export class EscalationsComponent {
  readonly rows: EscalationRow[] = [
    { customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, stage: 'Legal notice sent', amount: '₦320,000', assignedTo: 'Recovery Team A', status: 'overdue' },
    { customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, stage: 'Field visit scheduled', amount: '₦210,000', assignedTo: 'Recovery Team B', status: 'pending' },
    { customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, stage: 'Final reminder sent', amount: '₦95,000', assignedTo: 'Recovery Team A', status: 'pending' },
  ];
}
