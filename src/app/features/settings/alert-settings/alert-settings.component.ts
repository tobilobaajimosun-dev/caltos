import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SettingsRowComponent,
  AlertBannerComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  SelectComponent,
  SelectOption,
} from '../../../shared/components';

interface AlertToggle {
  label: string;
  subtitle: string;
  toggled: boolean;
}

interface AlertLogRow {
  type: string;
  recipient: string;
  sentAt: string;
  channel: string;
  status: BadgeStatus;
}

@Component({
  selector: 'app-alert-settings',
  standalone: true,
  imports: [SettingsRowComponent, AlertBannerComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert-settings.component.html',
  styleUrl: './alert-settings.component.scss',
})
export class AlertSettingsComponent {
  readonly opsAlerts = signal<AlertToggle[]>([
    { label: 'Failed debit alert', subtitle: 'Immediate notification to recovery team when a deduction fails on any channel', toggled: true },
    { label: 'Underpayment threshold alert', subtitle: 'Alert when collected amount is below expected by the configured %', toggled: true },
    { label: 'Mandate cancellation failure', subtitle: 'Alert when a mandate cancel request is not confirmed within 24h', toggled: true },
    { label: 'Daily digest', subtitle: 'Morning summary of overnight failed deductions, overdue accounts, and pending exceptions', toggled: true },
  ]);

  readonly borrowerAlerts = signal<AlertToggle[]>([
    { label: 'Pre-due date reminder', subtitle: 'SMS/email sent before repayment due date', toggled: true },
    { label: 'Missed payment alert', subtitle: 'Notify borrower when a deduction fails and manual payment is needed', toggled: true },
    { label: 'Payment confirmation', subtitle: 'Notify borrower confirming a successful deduction', toggled: true },
  ]);

  readonly underpaymentThreshold = signal('10');

  readonly reminderDaysOptions: SelectOption[] = [
    { value: '3', label: '3 days before' },
    { value: '5', label: '5 days before' },
    { value: '7', label: '7 days before' },
  ];
  readonly reminderDays = signal('5');

  readonly recipientOptions: SelectOption[] = [
    { value: 'recovery-team', label: 'Recovery team' },
    { value: 'ops-team', label: 'Operations team' },
    { value: 'management', label: 'Management' },
  ];
  readonly opsRecipient = signal('recovery-team');

  toggleOpsAlert(index: number, value: boolean) {
    this.opsAlerts.update((rows) => rows.map((r, i) => (i === index ? { ...r, toggled: value } : r)));
  }

  toggleBorrowerAlert(index: number, value: boolean) {
    this.borrowerAlerts.update((rows) => rows.map((r, i) => (i === index ? { ...r, toggled: value } : r)));
  }

  readonly alertLog: AlertLogRow[] = [
    { type: 'Failed debit alert', recipient: 'Recovery team', sentAt: '2026-07-05 06:15', channel: 'In-app + Email', status: 'successful' },
    { type: 'Underpayment threshold alert', recipient: 'Operations team', sentAt: '2026-07-04 09:20', channel: 'Email', status: 'successful' },
    { type: 'Payment confirmation', recipient: 'Chika Okafor', sentAt: '2026-07-04 08:02', channel: 'SMS', status: 'successful' },
    { type: 'Missed payment alert', recipient: 'Gideon Mbogo', sentAt: '2026-07-03 14:40', channel: 'SMS', status: 'failed' },
    { type: 'Pre-due date reminder', recipient: 'Fatima Abdallah', sentAt: '2026-07-03 07:00', channel: 'Email', status: 'successful' },
    { type: 'Daily digest', recipient: 'Operations team', sentAt: '2026-07-03 06:00', channel: 'Email', status: 'successful' },
  ];
}
