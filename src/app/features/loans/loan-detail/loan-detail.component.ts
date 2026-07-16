import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  StatusBadgeComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
  ButtonComponent,
  AvatarComponent,
  ColumnTitleComponent,
  ModalComponent,
  ConfirmModalComponent,
  ToastComponent,
  InputComponent,
  TextareaComponent,
} from '../../../shared/components';
import { LoansService, LoanApplication, LoanStatus } from '../../../shared/services/loans.service';
import { ProductsService, DeductionChannelStatus, LiquidationPolicy, DEFAULT_LIQUIDATION_POLICY } from '../../../shared/services/products.service';

type DetailTab = 'about' | 'documents' | 'undertaking' | 'integrations' | 'payment' | 'activity' | 'liquidation';

interface RepaymentRow {
  installment: string;
  dueDate: string;
  amount: number;
  status: BadgeStatus;
}

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [
    RouterLink, DatePipe, StatusBadgeComponent, RoundTabsComponent, ButtonComponent, AvatarComponent,
    ColumnTitleComponent, ModalComponent, ConfirmModalComponent, ToastComponent, InputComponent, TextareaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-detail.component.html',
  styleUrl: './loan-detail.component.scss',
})
export class LoanDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly loansService = inject(LoansService);
  private readonly productsService = inject(ProductsService);
  private readonly cdr = inject(ChangeDetectorRef);

  loanId = '';
  loan: LoanApplication | null = null;

  readonly tabs: Tab[] = [
    { label: 'About loan', value: 'about' },
    { label: 'Documents', value: 'documents' },
    { label: 'Undertaking', value: 'undertaking' },
    { label: 'Integrations', value: 'integrations' },
    { label: 'Payment', value: 'payment' },
    { label: 'Liquidation', value: 'liquidation' },
    { label: 'Activity Log', value: 'activity' },
  ];
  readonly activeTab = signal<DetailTab>('about');
  setTab(value: string) {
    this.activeTab.set(value as DetailTab);
  }

  toastVisible = false;
  toastMessage = '';

  showEditAmount = false;
  editAmountValue = '';

  showBlacklistConfirm = false;

  ngOnInit() {
    this.route.params.subscribe(async (params) => {
      // IndexedDB's initial read is async — wait so a hard refresh straight to this URL
      // doesn't see a real loan as missing before it's finished loading.
      await this.loansService.ready;
      this.loanId = (params['id'] as string) ?? '';
      this.refreshLoan();
      // This app runs zoneless — the continuation after `await` isn't an Angular-tracked
      // event, so nothing repaints the view on its own without an explicit nudge here.
      this.cdr.markForCheck();
    });
  }

  private refreshLoan() {
    this.loan = this.loansService.getById(this.loanId) ?? null;
  }

  get product() {
    return this.loan ? this.productsService.getById(this.loan.productId) : undefined;
  }

  get productName(): string {
    return this.product?.name ?? this.loan?.productId ?? '';
  }

  statusBadge(status: LoanStatus): { status: BadgeStatus; label: string } {
    switch (status) {
      case 'new': return { status: 'active', label: 'New' };
      case 'declined': return { status: 'failed', label: 'Declined' };
      case 'documents_review': return { status: 'pending', label: 'Documents Review' };
      case 'closed': return { status: 'dormant', label: 'Closed' };
      case 'disbursed': return { status: 'successful', label: 'Disbursed' };
      case 'top_up_request': return { status: 'suspended', label: 'Top Up Request' };
    }
  }

  channelStatusBadge(status: DeductionChannelStatus): { status: BadgeStatus; label: string } {
    switch (status) {
      case 'not_configured': return { status: 'dormant', label: 'Not configured' };
      case 'credentials_saved': return { status: 'pending', label: 'Credentials saved' };
      case 'test_passed': return { status: 'overdue', label: 'Test passed' };
      case 'live': return { status: 'successful', label: 'Live' };
      case 'needs_reverification': return { status: 'failed', label: 'Needs re-verification' };
    }
  }

  docStatusBadge(doc: { uploaded: boolean; approved: boolean }): { status: BadgeStatus; label: string } {
    if (doc.approved) return { status: 'successful', label: 'Approved' };
    if (doc.uploaded) return { status: 'pending', label: 'Uploaded — pending review' };
    return { status: 'inactive', label: 'Not uploaded' };
  }

  /** Enabled deduction rails as they were on productConfigSnapshot at the moment this
   * application was filed — never the live ProductRecord, so a later edit to the
   * product's channels/credentials can't retroactively change what this loan shows. */
  get snapshotDeductionChannels() {
    return this.loan?.productConfigSnapshot.deductionChannels.filter((c) => c.enabled) ?? [];
  }

  /** A simple repayment schedule derived from amount/tenor — installments already collected
   * for a disbursed/closed/top-up loan are marked paid; everything else is upcoming. */
  get repaymentSchedule(): RepaymentRow[] {
    if (!this.loan) return [];
    const { tenor, monthlyRepayment, status, updatedAt } = this.loan;
    const paidCount = status === 'closed' ? tenor : status === 'disbursed' || status === 'top_up_request' ? Math.min(3, tenor) : 0;
    const start = new Date(updatedAt);
    return Array.from({ length: tenor }, (_, i) => {
      const due = new Date(start);
      due.setMonth(due.getMonth() + i + 1);
      return {
        installment: `Installment ${i + 1}`,
        dueDate: due.toISOString().slice(0, 10),
        amount: monthlyRepayment,
        status: (i < paidCount ? 'successful' : 'pending') as BadgeStatus,
      };
    });
  }

  // ── Liquidation ──────────────────────────────────────────────────────────────
  /** The policy this loan was actually disbursed under — from productConfigSnapshot, never the
   * live ProductRecord, so editing the product's policy later never changes this loan's terms.
   * Falls back to defaults for loans created before this field existed. */
  get liquidationPolicy(): LiquidationPolicy {
    return this.loan?.productConfigSnapshot.liquidationPolicy ?? DEFAULT_LIQUIDATION_POLICY;
  }

  /** How many full months have elapsed since disbursement (proxied by updatedAt, same reference
   * point repaymentSchedule already uses to derive installment due dates). */
  private get monthsSinceDisbursement(): number {
    if (!this.loan) return 0;
    const start = new Date(this.loan.updatedAt);
    const now = new Date();
    return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
  }

  get earliestEarlySettlementDate(): Date | null {
    if (!this.loan) return null;
    const start = new Date(this.loan.updatedAt);
    start.setMonth(start.getMonth() + this.liquidationPolicy.earlySettlementMinTenorElapsed);
    return start;
  }

  /** Null when early settlement is currently allowed; otherwise the reason it's blocked. */
  get earlySettlementBlockReason(): string | null {
    const policy = this.liquidationPolicy;
    if (!policy.earlySettlementAllowed) return 'Early settlement is not available for this product.';
    if (this.monthsSinceDisbursement < policy.earlySettlementMinTenorElapsed) {
      return `Early settlement is available from ${this.earliestEarlySettlementDate?.toISOString().slice(0, 10)}.`;
    }
    return null;
  }

  get canEarlySettle(): boolean {
    return this.loan?.status === 'disbursed' && !this.earlySettlementBlockReason;
  }

  /**
   * Payoff amount as of today, computed purely from this loan's snapshotted terms (never the
   * live product). Consistent with the flat-rate interest model used everywhere else in this
   * app: outstanding principal is the straight-line share of the original amount for whatever
   * installments remain, and "still owed to date" additionally includes the interest portion of
   * those remaining installments.
   */
  get payoffBreakdown(): { remainingInstallments: number; balance: number; fee: number; total: number } {
    if (!this.loan) return { remainingInstallments: 0, balance: 0, fee: 0, total: 0 };
    const { tenor, amount, monthlyRepayment, status } = this.loan;
    const paidCount = status === 'closed' ? tenor : status === 'disbursed' || status === 'top_up_request' ? Math.min(3, tenor) : 0;
    const remainingInstallments = Math.max(0, tenor - paidCount);
    const policy = this.liquidationPolicy;
    const outstandingPrincipal = (amount / tenor) * remainingInstallments;
    const outstandingWithInterest = monthlyRepayment * remainingInstallments;
    const balance = policy.earlySettlementInterestTreatment === 'waived' ? outstandingPrincipal : outstandingWithInterest;
    const fee = policy.earlySettlementFeeType === 'none' ? 0
      : policy.earlySettlementFeeType === 'flat' ? policy.earlySettlementFeeValue
      : balance * (policy.earlySettlementFeeValue / 100);
    return { remainingInstallments, balance: Math.round(balance), fee: Math.round(fee), total: Math.round(balance + fee) };
  }

  showEarlySettleConfirm = false;

  openEarlySettle() {
    if (!this.canEarlySettle) return;
    this.showEarlySettleConfirm = true;
  }

  cancelEarlySettle() {
    this.showEarlySettleConfirm = false;
  }

  confirmEarlySettle() {
    if (!this.loan || !this.canEarlySettle) return;
    const { balance, fee, total } = this.payoffBreakdown;
    this.loansService.setStatus(this.loan.id, 'closed');
    this.loansService.addActivity(
      this.loan.id,
      `Loan liquidated early — payoff ₦${total.toLocaleString()} collected (₦${balance.toLocaleString()} balance + ₦${fee.toLocaleString()} fee)`,
      'Admin',
    );
    this.refreshLoan();
    this.showEarlySettleConfirm = false;
    this.showToast('Loan liquidated — payoff collected.');
  }

  showWriteOff = false;
  writeOffReason = '';

  openWriteOff() {
    this.writeOffReason = '';
    this.showWriteOff = true;
  }

  closeWriteOff() {
    this.showWriteOff = false;
  }

  get canSubmitWriteOff(): boolean {
    return this.writeOffReason.trim().length > 0;
  }

  submitWriteOff() {
    if (!this.loan || !this.canSubmitWriteOff) return;
    const reason = this.writeOffReason.trim();
    const auto = this.liquidationPolicy.writeOffApprovalRequired === 'auto';
    // Always logged for audit, regardless of approval mode — the reason field is mandatory above.
    this.loansService.addActivity(
      this.loan.id,
      auto ? `Loan written off — ${reason}` : `Loan write-off requested — ${reason} (pending manual approval)`,
      'Admin',
    );
    if (auto) this.loansService.setStatus(this.loan.id, 'closed');
    this.refreshLoan();
    this.showWriteOff = false;
    this.showToast(auto ? 'Loan written off.' : 'Write-off request submitted for manual approval.');
  }

  viewProfile() {
    this.showToast('Customer profile view is coming soon.');
  }

  contactCustomer() {
    if (!this.loan) return;
    window.location.href = `tel:${this.loan.customerPhone}`;
  }

  openBlacklist() {
    this.showBlacklistConfirm = true;
  }

  cancelBlacklist() {
    this.showBlacklistConfirm = false;
  }

  confirmBlacklist() {
    if (!this.loan) return;
    this.loansService.addActivity(this.loan.id, `${this.loan.customerName} was blacklisted`, 'Admin');
    this.refreshLoan();
    this.showBlacklistConfirm = false;
    this.showToast('Customer has been blacklisted.');
  }

  openEditAmount() {
    if (!this.loan) return;
    this.editAmountValue = String(this.loan.amount);
    this.showEditAmount = true;
  }

  closeEditAmount() {
    this.showEditAmount = false;
  }

  saveAmount() {
    if (!this.loan) return;
    const amount = +this.editAmountValue;
    if (!amount || amount <= 0) return;
    const totalRepayment = Math.ceil(amount * (1 + this.loan.interestRate / 100));
    const monthlyRepayment = Math.ceil(totalRepayment / this.loan.tenor);
    this.loansService.update(this.loan.id, { amount, totalRepayment, monthlyRepayment });
    this.loansService.addActivity(this.loan.id, `Loan amount edited to ₦${amount.toLocaleString()}`, 'Admin');
    this.refreshLoan();
    this.showEditAmount = false;
    this.showToast('Loan amount updated.');
  }

  private showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
      this.cdr.markForCheck();
    }, 3000);
  }
}
