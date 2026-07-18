import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  ButtonComponent,
} from '../../../shared/components';

interface RepaymentRow {
  date: string;
  amount: string;
  channel: string;
  status: BadgeStatus;
}

interface ScheduleRow {
  dueDate: string;
  amount: string;
  principal: string;
  interest: string;
  status: 'upcoming' | 'overdue';
}

@Component({
  selector: 'app-repayment-portal',
  standalone: true,
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repayment-portal.component.html',
  styleUrl: './repayment-portal.component.scss',
})
export class RepaymentPortalComponent {
  readonly borrowerName = 'Chika Okafor';
  readonly product = 'Salary Advance Loan';
  readonly loanRef = 'CAL-2026-004821';

  // ── Loan summary ────────────────────────────────────────────────────────────
  readonly principalAmount = 500_000;
  readonly totalRepayable = 585_000;
  readonly amountRepaid = 175_000;
  readonly outstandingBalance = this.totalRepayable - this.amountRepaid;
  readonly repaymentProgress = Math.round((this.amountRepaid / this.totalRepayable) * 100);

  // ── Next payment ─────────────────────────────────────────────────────────────
  readonly nextPaymentAmount = 25_000;
  readonly nextDueDate = '2026-08-15';
  readonly paymentStreak = 4;

  // ── Virtual account ──────────────────────────────────────────────────────────
  readonly virtualAccountNumber = '0123456789';
  readonly virtualAccountBank = 'Providus Bank';
  readonly virtualAccountName = 'Caltos / Chika Okafor';
  virtualAccountCopied = false;

  copyAccountNumber() {
    navigator.clipboard?.writeText(this.virtualAccountNumber);
    this.virtualAccountCopied = true;
    setTimeout(() => { this.virtualAccountCopied = false; }, 2000);
  }

  // ── Mandate ──────────────────────────────────────────────────────────────────
  readonly mandateChannel = 'Remita';
  readonly mandateStatus: BadgeStatus = 'active';
  readonly mandateAccountNumber = '••••••6789';
  readonly mandateBank = 'First Bank';

  // ── Repayment schedule ───────────────────────────────────────────────────────
  readonly schedule: ScheduleRow[] = [
    { dueDate: '2026-08-15', amount: '₦25,000', principal: '₦18,500', interest: '₦6,500', status: 'upcoming' },
    { dueDate: '2026-09-15', amount: '₦25,000', principal: '₦19,000', interest: '₦6,000', status: 'upcoming' },
    { dueDate: '2026-10-15', amount: '₦25,000', principal: '₦19,500', interest: '₦5,500', status: 'upcoming' },
  ];

  // ── Repayment history ────────────────────────────────────────────────────────
  readonly history: RepaymentRow[] = [
    { date: '2026-07-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
    { date: '2026-06-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
    { date: '2026-05-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
    { date: '2026-04-15', amount: '₦25,000', channel: 'Remita', status: 'failed' },
    { date: '2026-04-16', amount: '₦25,000', channel: 'Virtual Account', status: 'successful' },
    { date: '2026-03-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
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
