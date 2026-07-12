import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  StatusBadgeComponent,
  BadgeStatus,
  DrawerComponent,
  TextareaComponent,
  ButtonComponent,
  ToastComponent,
} from '../../../shared/components';
import { LoansService, LoanApplication, manualReviewReasons } from '../../../shared/services/loans.service';
import { ProductsService } from '../../../shared/services/products.service';

@Component({
  selector: 'app-manual-review',
  standalone: true,
  imports: [RouterLink, KpiCardComponent, ColumnTitleComponent, StatusBadgeComponent, DrawerComponent, TextareaComponent, ButtonComponent, ToastComponent],
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

  private showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
      this.cdr.markForCheck();
    }, 3000);
  }
}
