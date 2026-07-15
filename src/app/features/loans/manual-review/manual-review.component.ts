import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  StatusBadgeComponent,
  BadgeStatus,
  DrawerComponent,
  TextareaComponent,
  ButtonComponent,
  ToastComponent,
  ModalComponent,
} from '../../../shared/components';
import { LoansService, LoanApplication, manualReviewReasons } from '../../../shared/services/loans.service';
import { ProductsService } from '../../../shared/services/products.service';

@Component({
  selector: 'app-manual-review',
  standalone: true,
  imports: [RouterLink, DecimalPipe, KpiCardComponent, ColumnTitleComponent, StatusBadgeComponent, DrawerComponent, TextareaComponent, ButtonComponent, ToastComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manual-review.component.html',
  styleUrl: './manual-review.component.scss',
})
export class ManualReviewComponent {
  private readonly loansService = inject(LoansService);
  private readonly productsService = inject(ProductsService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly queue = this.loansService.manualReviewQueue;

  readonly selected = signal<LoanApplication | null>(null);
  readonly note = signal('');

  toastVisible = false;
  toastMessage = '';

  productName(productId: string): string {
    return this.productsService.getById(productId)?.name ?? productId;
  }

  reasonsFor(loan: LoanApplication): string[] {
    return manualReviewReasons(loan);
  }

  statusBadge(loan: LoanApplication): { status: BadgeStatus; label: string } {
    return loan.status === 'new' ? { status: 'active', label: 'New' } : { status: 'pending', label: 'Documents Review' };
  }

  open(loan: LoanApplication) {
    this.note.set('');
    this.selected.set(loan);
  }

  close() {
    this.selected.set(null);
  }

  resolve(decision: 'approved' | 'declined' | 'more_info') {
    const loan = this.selected();
    if (!loan) return;
    this.loansService.resolveManualReview(loan.id, decision, this.note().trim());
    this.close();
    const labels: Record<'approved' | 'declined' | 'more_info', string> = {
      approved: 'Application approved and moved forward.',
      declined: 'Application declined.',
      more_info: 'Requested more information from the applicant.',
    };
    this.showToast(labels[decision]);
  }

  // ── Setup deductions / disburse (post-approval, 'documents_review' loans) ──
  showDeductionModal = false;

  get allDeductionChannelsLive(): boolean {
    const loan = this.selected();
    if (!loan) return false;
    return loan.deductionChannelStatus.length > 0 && loan.deductionChannelStatus.every((c) => c.status === 'live');
  }

  openDeductionSetup() {
    this.showDeductionModal = true;
  }

  closeDeductionSetup() {
    this.showDeductionModal = false;
  }

  confirmDeductionSetup() {
    const loan = this.selected();
    if (!loan) return;
    const deductionChannelStatus = loan.deductionChannelStatus.map((c) => ({ ...c, status: 'live' as const, lastAttempt: new Date().toISOString().slice(0, 10), result: 'Mandate confirmed' }));
    this.loansService.update(loan.id, { deductionChannelStatus });
    this.selected.set({ ...loan, deductionChannelStatus });
    this.showDeductionModal = false;
    this.showToast('Deductions and mandates set up for this loan.');
  }

  disburse() {
    const loan = this.selected();
    if (!loan) return;
    this.loansService.setStatus(loan.id, 'disbursed');
    this.close();
    this.showToast(`${loan.loanUniqueId} disbursed.`);
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
