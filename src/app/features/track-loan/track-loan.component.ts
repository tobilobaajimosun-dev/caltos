import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  KpiCardComponent, StatusBadgeComponent, BadgeStatus, ButtonComponent,
  InputComponent, EmptyStateComponent, ColumnTitleComponent, TableItemComponent,
  ConfirmModalComponent,
} from '../../shared/components';
import { LoansService, LoanApplication } from '../../shared/services/loans.service';
import { buildRepaymentSchedule, RepaymentInstallment } from '../../shared/utils/repayment-schedule';

@Component({
  selector: 'app-track-loan',
  standalone: true,
  imports: [
    FormsModule, KpiCardComponent, StatusBadgeComponent, ButtonComponent,
    InputComponent, EmptyStateComponent, ColumnTitleComponent, TableItemComponent, ConfirmModalComponent,
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

  async lookup() {
    await this.loansService.ready;
    const found = this.loansService.getByLoanUniqueId(this.reference());
    this.loan.set(found);
    this.schedule.set(found ? buildRepaymentSchedule(found) : []);
    this.searched.set(true);
    this.liquidated.set(false);
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
