import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
} from '../../../shared/components';

interface EmployerRow {
  name: string;
  employees: number;
  deductionChannel: string;
  status: BadgeStatus;
}

@Component({
  selector: 'app-employer-portal',
  standalone: true,
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employer-portal.component.html',
  styleUrl: './employer-portal.component.scss',
})
export class EmployerPortalComponent {
  readonly employers: EmployerRow[] = [
    { name: 'Federal Ministry of Works', employees: 1240, deductionChannel: 'IPPIS', status: 'active' },
    { name: 'Lagos State Government', employees: 860, deductionChannel: 'Remita', status: 'active' },
    { name: 'Dangote Group', employees: 320, deductionChannel: 'Direct Debit', status: 'active' },
    { name: 'NYSC Corps Members', employees: 2100, deductionChannel: 'Remita', status: 'pending' },
  ];
}
