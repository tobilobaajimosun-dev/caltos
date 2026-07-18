import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, inject, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  ButtonComponent,
} from '../../../shared/components';

type NavItem = 'overview' | 'history' | 'virtual-account' | 'documents';

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
}

@Component({
  selector: 'app-repayment-portal',
  standalone: true,
  imports: [FormsModule, KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repayment-portal.component.html',
  styleUrl: './repayment-portal.component.scss',
})
export class RepaymentPortalComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  // ── BVN gate ─────────────────────────────────────────────────────────────────
  isAuthenticated = false;
  bvnInput = '';
  bvnError = '';
  isVerifying = false;

  get bvnValid(): boolean { return /^\d{11}$/.test(this.bvnInput); }

  verifyBvn() {
    if (!this.bvnValid) { this.bvnError = 'Enter a valid 11-digit BVN.'; return; }
    this.bvnError = '';
    this.isVerifying = true;
    this.cdr.markForCheck();
    // Simulate verification — swap for real BVN lookup in production
    setTimeout(() => {
      this.isVerifying = false;
      this.isAuthenticated = true;
      this.cdr.markForCheck();
    }, 1400);
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  activeNav: NavItem = 'overview';
  setNav(nav: NavItem) { this.activeNav = nav; this.cdr.markForCheck(); }

  // ── Loan data ────────────────────────────────────────────────────────────────
  readonly borrowerName = 'Chika Okafor';
  readonly product = 'Salary Advance Loan';
  readonly loanRef = 'CAL-2026-004821';
  readonly principalAmount = 500_000;
  readonly totalRepayable = 585_000;
  readonly amountRepaid = 175_000;
  readonly outstandingBalance = this.totalRepayable - this.amountRepaid;
  readonly repaymentProgress = Math.round((this.amountRepaid / this.totalRepayable) * 100);
  readonly nextPaymentAmount = 25_000;
  readonly nextDueDate = '2026-08-15';
  readonly paymentStreak = 4;

  // ── Virtual account ──────────────────────────────────────────────────────────
  readonly virtualAccountNumber = '0123456789';
  readonly virtualAccountBank = 'Providus Bank';
  readonly virtualAccountName = 'Caltos / Chika Okafor';
  virtualAccountCopied = false;

  copyAccountNumber() {
    if (isPlatformBrowser(this.platformId)) navigator.clipboard?.writeText(this.virtualAccountNumber);
    this.virtualAccountCopied = true;
    this.cdr.markForCheck();
    setTimeout(() => { this.virtualAccountCopied = false; this.cdr.markForCheck(); }, 2000);
  }

  // ── Mandate ──────────────────────────────────────────────────────────────────
  readonly mandateChannel = 'Remita';
  readonly mandateStatus: BadgeStatus = 'active';
  readonly mandateAccountNumber = '••••••6789';
  readonly mandateBank = 'First Bank';

  // ── Schedule ─────────────────────────────────────────────────────────────────
  readonly schedule: ScheduleRow[] = [
    { dueDate: '2026-08-15', amount: '₦25,000', principal: '₦18,500', interest: '₦6,500' },
    { dueDate: '2026-09-15', amount: '₦25,000', principal: '₦19,000', interest: '₦6,000' },
    { dueDate: '2026-10-15', amount: '₦25,000', principal: '₦19,500', interest: '₦5,500' },
    { dueDate: '2026-11-15', amount: '₦25,000', principal: '₦20,000', interest: '₦5,000' },
  ];

  // ── History ──────────────────────────────────────────────────────────────────
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
    if (!isPlatformBrowser(this.platformId)) return;
    const header = 'Date,Amount,Channel,Status\n';
    const rows = this.history.map(r => `${r.date},${r.amount},${r.channel},${this.statusLabel(r.status)}`).join('\n');
    const content = format === 'csv' ? header + rows
      : `Repayment Statement\nBorrower: ${this.borrowerName}\nProduct: ${this.product}\n\n` +
        this.history.map(r => `${r.date}  ${r.amount}  ${r.channel}  ${this.statusLabel(r.status)}`).join('\n');
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repayment-${this.borrowerName.toLowerCase().replace(/\s+/g, '-')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
