import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SettingsRowComponent, AlertBannerComponent } from '../../../shared/components';

interface AlertToggle {
  label: string;
  subtitle: string;
  toggled: boolean;
}

@Component({
  selector: 'app-alert-settings',
  standalone: true,
  imports: [SettingsRowComponent, AlertBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert-settings.component.html',
  styleUrl: './alert-settings.component.scss',
})
export class AlertSettingsComponent {
  readonly alerts = signal<AlertToggle[]>([
    { label: 'Loan overdue', subtitle: 'Notify when a repayment is 1+ days overdue', toggled: true },
    { label: 'Low wallet balance', subtitle: 'Notify when wallet balance drops below ₦50,000', toggled: true },
    { label: 'Failed disbursement', subtitle: 'Notify immediately when a disbursement fails', toggled: true },
    { label: 'New loan application', subtitle: 'Notify when a customer submits a new application', toggled: false },
    { label: 'Reconciliation mismatch', subtitle: 'Notify when a transaction cannot be matched', toggled: true },
  ]);

  toggleAlert(index: number, value: boolean) {
    this.alerts.update((rows) => rows.map((r, i) => (i === index ? { ...r, toggled: value } : r)));
  }
}
