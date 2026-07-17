import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  KpiCardComponent, StatusBadgeComponent, BadgeStatus, ButtonComponent,
  InputComponent, EmptyStateComponent, ColumnTitleComponent, TableItemComponent,
  ConfirmModalComponent, ModalComponent,
} from '../../shared/components';
import { LoansService, LoanApplication } from '../../shared/services/loans.service';
import { buildRepaymentSchedule, RepaymentInstallment, InstallmentStatus } from '../../shared/utils/repayment-schedule';
import { formatThousands, parseThousands } from '../../shared/utils/number-format';

@Component({
  selector: 'app-track-loan',
  standalone: true,
  imports: [
    FormsModule, DecimalPipe, KpiCardComponent, StatusBadgeComponent, ButtonComponent,
    InputComponent, EmptyStateComponent, ColumnTitleComponent, TableItemComponent, ConfirmModalComponent, ModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './track-loan.component.html',
  styleUrl: './track-loan.component.scss',
})
export class TrackLoanComponent {
  private readonly loansService = inject(LoansService);

  reference = signal('');
  searched = signal(false);
  loan = signal<LoanApplication | undefined>(undefined);
  schedule = signal<RepaymentInstallment[]>([]);
  showLiquidateConfirm = signal(false);
  liquidated = signal(false);

  readonly statusLabels: Record<LoanApplication['status'], string> = {
    new: 'Under review',
    documents_review: 'Documents under review',
    declined: 'Declined',
    disbursed: 'Disbursed',
    closed: 'Closed',
    top_up_request: 'Top-up requested',
  };

  readonly statusBadgeMap: Record<LoanApplication['status'], BadgeStatus> = {
    new: 'pending',
    documents_review: 'pending',
    declined: 'inactive',
    disbursed: 'active',
    closed: 'successful',
    top_up_request: 'pending',
  };

  readonly installmentStatusLabels: Record<InstallmentStatus, string> = {
    paid: 'Paid', partial: 'Partially paid', overdue: 'Overdue', upcoming: 'Upcoming',
  };

  readonly installmentStatusBadgeMap: Record<InstallmentStatus, BadgeStatus> = {
    paid: 'successful', partial: 'pending', overdue: 'failed', upcoming: 'pending',
  };

  // ── Pay now (one installment, full or partial amount) ────────────────────────
  payingInstallment = signal<RepaymentInstallment | null>(null);
  payAmountInput = signal('');

  async lookup() {
    await this.loansService.ready;
    const found = this.loansService.getByLoanUniqueId(this.reference());
    this.loan.set(found);
    this.schedule.set(found ? buildRepaymentSchedule(found) : []);
    this.searched.set(true);
    this.liquidated.set(false);
  }

  openPayNow(installment: RepaymentInstallment) {
    this.payingInstallment.set(installment);
    this.payAmountInput.set(formatThousands(String(installment.amount - installment.amountPaid)));
  }

  closePayNow() {
    this.payingInstallment.set(null);
    this.payAmountInput.set('');
  }

  onPayAmountInput(raw: string) {
    this.payAmountInput.set(formatThousands(raw));
  }

  get payAmountValue(): number {
    return parseThousands(this.payAmountInput());
  }

  get payAmountValid(): boolean {
    const installment = this.payingInstallment();
    if (!installment) return false;
    const remaining = installment.amount - installment.amountPaid;
    return this.payAmountValue > 0 && this.payAmountValue <= remaining;
  }

  confirmPayNow() {
    const current = this.loan();
    const installment = this.payingInstallment();
    if (!current || !installment || !this.payAmountValid) return;
    this.loansService.recordRepayment(current.id, installment.dueDate, this.payAmountValue, 'Bank transfer');
    this.loan.set(this.loansService.getById(current.id));
    this.schedule.set(this.loan() ? buildRepaymentSchedule(this.loan()!) : []);
    this.closePayNow();
  }

  copyVirtualAccount(accountNumber: string) {
    navigator.clipboard?.writeText(accountNumber);
  }

  confirmLiquidate() {
    const current = this.loan();
    if (!current) return;
    this.loansService.setStatus(current.id, 'closed', 'Customer');
    this.loan.set(this.loansService.getById(current.id));
    this.schedule.set(this.loan() ? buildRepaymentSchedule(this.loan()!) : []);
    this.showLiquidateConfirm.set(false);
    this.liquidated.set(true);
  }
}
