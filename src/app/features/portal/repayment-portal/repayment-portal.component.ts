import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, inject, OnDestroy, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BadgeStatus } from '../../../shared/components';

type NavItem = 'home' | 'loans' | 'history' | 'documents' | 'profile';
type GateStep = 'bvn' | 'otp';

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

interface Loan {
  id: string;
  product: string;
  ref: string;
  principalAmount: number;
  totalRepayable: number;
  amountRepaid: number;
  status: 'active' | 'completed';
  nextPaymentAmount: number;
  nextDueDate: string;
  completedDate?: string;
  paymentStreak: number;
  mandateChannel: string;
  mandateAccountNumber: string;
  mandateBank: string;
  schedule: ScheduleRow[];
  history: RepaymentRow[];
}

@Component({
  selector: 'app-repayment-portal',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.rp-dark]': 'darkMode' },
  templateUrl: './repayment-portal.component.html',
  styleUrl: './repayment-portal.component.scss',
})
export class RepaymentPortalComponent implements OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.darkMode = localStorage.getItem('rp-theme') === 'dark';
    }
  }

  ngOnDestroy() {
    this.clearResendTimer();
  }

  // ── Gate (BVN → OTP) ─────────────────────────────────────────────────────────
  isAuthenticated = false;
  gateStep: GateStep = 'bvn';
  bvnInput = '';
  bvnError = '';
  isVerifying = false;
  maskedBvn = '';
  readonly maskedPhone = '0803 ••• ••67';

  otpInput = '';
  otpError = '';
  isVerifyingOtp = false;
  resendCountdown = 0;
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  get bvnValid(): boolean { return /^\d{11}$/.test(this.bvnInput); }
  get otpValid(): boolean { return /^\d{6}$/.test(this.otpInput); }

  verifyBvn() {
    if (!this.bvnValid) { this.bvnError = 'Please enter a valid 11-digit BVN.'; return; }
    this.bvnError = '';
    this.isVerifying = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.isVerifying = false;
      this.gateStep = 'otp';
      this.startResendCountdown();
      this.cdr.markForCheck();
    }, 1400);
  }

  verifyOtp() {
    if (!this.otpValid) { this.otpError = 'Enter the 6-digit code we sent you.'; return; }
    this.otpError = '';
    this.isVerifyingOtp = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.isVerifyingOtp = false;
      if (this.otpInput === '123456') {
        this.maskedBvn = '••••••• ' + this.bvnInput.slice(-4);
        this.isAuthenticated = true;
        this.bvnInput = '';
        this.otpInput = '';
        this.clearResendTimer();
      } else {
        this.otpError = 'That code didn\u2019t match. Check the SMS and try again.';
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  resendCode() {
    if (this.resendCountdown > 0) return;
    this.otpError = '';
    this.otpInput = '';
    this.startResendCountdown();
    this.cdr.markForCheck();
  }

  backToBvn() {
    this.gateStep = 'bvn';
    this.otpInput = '';
    this.otpError = '';
    this.clearResendTimer();
    this.cdr.markForCheck();
  }

  private startResendCountdown() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.clearResendTimer();
    this.resendCountdown = 30;
    this.resendTimer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) this.clearResendTimer();
      this.cdr.markForCheck();
    }, 1000);
  }

  private clearResendTimer() {
    if (this.resendTimer) { clearInterval(this.resendTimer); this.resendTimer = null; }
    this.resendCountdown = 0;
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  activeNav: NavItem = 'home';
  setNav(nav: NavItem) { this.activeNav = nav; this.cdr.markForCheck(); }

  // ── Borrower / profile ───────────────────────────────────────────────────────
  profileName = 'Chika Okafor';
  profileEmail = 'chika.okafor@example.com';
  profilePhone = '0803 555 2267';
  profileAddress = '12 Adeola Odeku Street, Victoria Island, Lagos';
  profileSaving = false;
  profileSaved = false;

  get borrowerName(): string { return this.profileName; }

  saveProfile() {
    if (this.profileSaving) return;
    this.profileSaving = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.profileSaving = false;
      this.profileSaved = true;
      this.cdr.markForCheck();
      setTimeout(() => { this.profileSaved = false; this.cdr.markForCheck(); }, 2000);
    }, 800);
  }

  // ── Avatar dropdown / theme / logout ─────────────────────────────────────────
  avatarMenuOpen = false;
  logoutConfirmOpen = false;
  darkMode = false;

  toggleAvatarMenu() {
    this.avatarMenuOpen = !this.avatarMenuOpen;
    if (!this.avatarMenuOpen) this.logoutConfirmOpen = false;
    this.cdr.markForCheck();
  }

  closeAvatarMenu() {
    this.avatarMenuOpen = false;
    this.logoutConfirmOpen = false;
    this.cdr.markForCheck();
  }

  openProfile() {
    this.setNav('profile');
    this.closeAvatarMenu();
  }

  setTheme(dark: boolean) {
    this.darkMode = dark;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('rp-theme', dark ? 'dark' : 'light');
    }
    this.cdr.markForCheck();
  }

  requestLogout() { this.logoutConfirmOpen = true; this.cdr.markForCheck(); }
  cancelLogout() { this.logoutConfirmOpen = false; this.cdr.markForCheck(); }

  confirmLogout() {
    this.isAuthenticated = false;
    this.gateStep = 'bvn';
    this.bvnInput = '';
    this.bvnError = '';
    this.otpInput = '';
    this.otpError = '';
    this.isVerifying = false;
    this.isVerifyingOtp = false;
    this.maskedBvn = '';
    this.clearResendTimer();
    this.avatarMenuOpen = false;
    this.logoutConfirmOpen = false;
    this.chatOpen = false;
    this.activeNav = 'home';
    this.selectedLoanId = this.loans[0].id;
    this.virtualAccountCopied = false;
    this.letterIndebtednessRequested = false;
    this.letterClearanceRequested = false;
    this.letterIndebtednessLoading = false;
    this.letterClearanceLoading = false;
    this.cdr.markForCheck();
  }

  // ── Loans ────────────────────────────────────────────────────────────────────
  readonly loans: Loan[] = [
    {
      id: 'loan-salary',
      product: 'Salary Advance Loan',
      ref: 'CAL-2026-004821',
      principalAmount: 500_000,
      totalRepayable: 585_000,
      amountRepaid: 175_500,
      status: 'active',
      nextPaymentAmount: 25_000,
      nextDueDate: '2026-08-15',
      paymentStreak: 4,
      mandateChannel: 'Remita',
      mandateAccountNumber: '••••••6789',
      mandateBank: 'First Bank',
      schedule: [
        { dueDate: '2026-08-15', amount: '₦25,000', principal: '₦18,500', interest: '₦6,500' },
        { dueDate: '2026-09-15', amount: '₦25,000', principal: '₦19,000', interest: '₦6,000' },
        { dueDate: '2026-10-15', amount: '₦25,000', principal: '₦19,500', interest: '₦5,500' },
        { dueDate: '2026-11-15', amount: '₦25,000', principal: '₦20,000', interest: '₦5,000' },
      ],
      history: [
        { date: '2026-07-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
        { date: '2026-06-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
        { date: '2026-05-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
        { date: '2026-04-15', amount: '₦25,000', channel: 'Remita', status: 'failed' },
        { date: '2026-04-16', amount: '₦25,000', channel: 'Virtual Account', status: 'successful' },
        { date: '2026-03-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
        { date: '2026-02-15', amount: '₦25,000', channel: 'Remita', status: 'successful' },
      ],
    },
    {
      id: 'loan-personal',
      product: 'Personal Loan',
      ref: 'CAL-2026-003317',
      principalAmount: 200_000,
      totalRepayable: 240_000,
      amountRepaid: 156_000,
      status: 'active',
      nextPaymentAmount: 20_000,
      nextDueDate: '2026-08-01',
      paymentStreak: 6,
      mandateChannel: 'NIBSS e-mandate',
      mandateAccountNumber: '••••••4412',
      mandateBank: 'GTBank',
      schedule: [
        { dueDate: '2026-08-01', amount: '₦20,000', principal: '₦16,800', interest: '₦3,200' },
        { dueDate: '2026-09-01', amount: '₦20,000', principal: '₦17,200', interest: '₦2,800' },
        { dueDate: '2026-10-01', amount: '₦20,000', principal: '₦17,600', interest: '₦2,400' },
      ],
      history: [
        { date: '2026-07-01', amount: '₦20,000', channel: 'NIBSS e-mandate', status: 'successful' },
        { date: '2026-06-01', amount: '₦20,000', channel: 'NIBSS e-mandate', status: 'successful' },
        { date: '2026-05-01', amount: '₦20,000', channel: 'NIBSS e-mandate', status: 'successful' },
        { date: '2026-04-01', amount: '₦20,000', channel: 'Virtual Account', status: 'successful' },
      ],
    },
    {
      id: 'loan-device',
      product: 'Device Finance Loan',
      ref: 'CAL-2025-001954',
      principalAmount: 130_000,
      totalRepayable: 150_000,
      amountRepaid: 150_000,
      status: 'completed',
      nextPaymentAmount: 0,
      nextDueDate: '—',
      completedDate: '2026-03-20',
      paymentStreak: 6,
      mandateChannel: 'Remita',
      mandateAccountNumber: '••••••6789',
      mandateBank: 'First Bank',
      schedule: [],
      history: [
        { date: '2026-03-20', amount: '₦25,000', channel: 'Remita', status: 'successful' },
        { date: '2026-02-20', amount: '₦25,000', channel: 'Remita', status: 'successful' },
        { date: '2026-01-20', amount: '₦25,000', channel: 'Remita', status: 'successful' },
        { date: '2025-12-20', amount: '₦25,000', channel: 'Remita', status: 'successful' },
        { date: '2025-11-20', amount: '₦25,000', channel: 'Remita', status: 'successful' },
        { date: '2025-10-20', amount: '₦25,000', channel: 'Remita', status: 'successful' },
      ],
    },
  ];

  selectedLoanId = this.loans[0].id;

  get selectedLoan(): Loan {
    return this.loans.find(l => l.id === this.selectedLoanId) ?? this.loans[0];
  }

  selectLoan(id: string) {
    this.selectedLoanId = id;
    this.cdr.markForCheck();
  }

  viewLoan(id: string) {
    this.selectLoan(id);
    this.setNav('home');
  }

  loanOutstanding(loan: Loan): number {
    return loan.totalRepayable - loan.amountRepaid;
  }

  loanProgress(loan: Loan): number {
    return Math.round((loan.amountRepaid / loan.totalRepayable) * 100);
  }

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

  // ── Chat widget ──────────────────────────────────────────────────────────────
  chatOpen = false;
  toggleChat() { this.chatOpen = !this.chatOpen; this.cdr.markForCheck(); }
  closeChat() { this.chatOpen = false; this.cdr.markForCheck(); }

  // ── History helpers ──────────────────────────────────────────────────────────
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
    const loan = this.selectedLoan;
    const header = 'Date,Amount,Channel,Status\n';
    const rows = loan.history.map(r => `${r.date},${r.amount},${r.channel},${this.statusLabel(r.status)}`).join('\n');
    const content = format === 'csv' ? header + rows
      : `Repayment Statement\nBorrower: ${this.borrowerName}\nProduct: ${loan.product}\n\n` +
        loan.history.map(r => `${r.date}  ${r.amount}  ${r.channel}  ${this.statusLabel(r.status)}`).join('\n');
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repayment-${this.borrowerName.toLowerCase().replace(/\s+/g, '-')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Letter requests ───────────────────────────────────────────────────────────
  letterIndebtednessRequested = false;
  letterClearanceRequested = false;
  letterIndebtednessLoading = false;
  letterClearanceLoading = false;

  requestLetter(type: 'indebtedness' | 'clearance') {
    if (type === 'indebtedness') {
      if (this.letterIndebtednessRequested || this.letterIndebtednessLoading) return;
      this.letterIndebtednessLoading = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.letterIndebtednessLoading = false;
        this.letterIndebtednessRequested = true;
        this.cdr.markForCheck();
      }, 1000);
    } else {
      if (this.letterClearanceRequested || this.letterClearanceLoading) return;
      this.letterClearanceLoading = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.letterClearanceLoading = false;
        this.letterClearanceRequested = true;
        this.cdr.markForCheck();
      }, 1000);
    }
  }
}
