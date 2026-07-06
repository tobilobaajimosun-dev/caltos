import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  AlertBannerComponent,
  ButtonComponent,
} from '../../../shared/components';

interface RepaymentRow {
  date: string;
  amount: string;
  channel: string;
  status: BadgeStatus;
}

@Component({
  selector: 'app-repayment-portal',
  standalone: true,
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent, AlertBannerComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repayment-portal.component.html',
  styleUrl: './repayment-portal.component.scss',
})
export class RepaymentPortalComponent {
  readonly borrowerName = 'Chika Okafor';
  readonly product = 'Salary Advance Loan';

  readonly outstandingPrincipal = 210_000;
  readonly outstandingInterest = 18_500;
  readonly outstandingFees = 4_500;
  readonly totalOutstanding = this.outstandingPrincipal + this.outstandingInterest + this.outstandingFees;

  readonly mandateChannel = 'Remita';
  readonly mandateStatus: BadgeStatus = 'active';

  readonly nextDueDate = '2026-07-15';
  readonly paymentStreak = 4;

  readonly history: RepaymentRow[] = [
    { date: '2026-06-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
    { date: '2026-05-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
    { date: '2026-04-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
    { date: '2026-03-15', amount: '₦25,000', channel: 'Remita', status: 'failed' },
    { date: '2026-03-16', amount: '₦25,000', channel: 'Remita', status: 'successful' },
    { date: '2026-02-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
  ];

  statusLabel(status: BadgeStatus): string {
    switch (status) {
      case 'successful': return 'Collected';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      default: return 'Refunded';
    }
  }

  downloadStatement(format: 'csv' | 'pdf') {
    if (format === 'csv') {
      const header = 'Date,Amount,Channel,Status\n';
      const rows = this.history.map((r) => `${r.date},${r.amount},${r.channel},${this.statusLabel(r.status)}`).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repayment-statement-${this.borrowerName.toLowerCase().replace(/\s+/g, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const content = `Repayment Statement\n\nBorrower: ${this.borrowerName}\nProduct: ${this.product}\n\n` +
        this.history.map((r) => `${r.date}  ${r.amount}  ${r.channel}  ${this.statusLabel(r.status)}`).join('\n');
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repayment-statement-${this.borrowerName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}
