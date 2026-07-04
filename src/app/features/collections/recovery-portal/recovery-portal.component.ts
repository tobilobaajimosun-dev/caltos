import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KpiCardComponent, AvatarComponent, ProgressBarComponent } from '../../../shared/components';

interface OfficerRow {
  name: string;
  casesAssigned: number;
  recoveredPct: number;
  recoveredAmount: string;
}

@Component({
  selector: 'app-recovery-portal',
  standalone: true,
  imports: [KpiCardComponent, AvatarComponent, ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recovery-portal.component.html',
  styleUrl: './recovery-portal.component.scss',
})
export class RecoveryPortalComponent {
  readonly officers: OfficerRow[] = [
    { name: 'Tunde Bakare', casesAssigned: 18, recoveredPct: 72, recoveredAmount: '₦890,000' },
    { name: 'Ngozi Eze', casesAssigned: 14, recoveredPct: 58, recoveredAmount: '₦610,000' },
    { name: 'Yusuf Ibrahim', casesAssigned: 21, recoveredPct: 45, recoveredAmount: '₦540,000' },
  ];
}
