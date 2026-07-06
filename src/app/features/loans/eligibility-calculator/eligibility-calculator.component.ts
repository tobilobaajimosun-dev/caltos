import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { KpiCardComponent, InputComponent, SelectComponent, SelectOption } from '../../../shared/components';
import { ProductsService } from '../../../shared/services/products.service';

@Component({
  selector: 'app-eligibility-calculator',
  imports: [KpiCardComponent, InputComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eligibility-calculator.component.html',
  styleUrl: './eligibility-calculator.component.scss',
})
export class EligibilityCalculatorComponent {
  private readonly productsService = inject(ProductsService);

  readonly monthlySalary = signal('250000');
  readonly existingObligations = signal('30000');
  readonly productId = signal('');

  readonly products = this.productsService.products;

  readonly productOptions = computed<SelectOption[]>(() =>
    this.products().map((p) => ({ value: p.id, label: p.name })),
  );

  readonly selectedProduct = computed(() => this.products().find((p) => p.id === this.productId()) ?? this.products()[0]);

  private toNumber(raw: string): number {
    return Number(raw.replace(/,/g, '')) || 0;
  }

  /**
   * Affordability rule: a borrower's total monthly obligations — existing loan
   * repayments plus the new loan's estimated monthly repayment — should not exceed
   * 33% of gross monthly salary. This is a common debt-to-income convention used in
   * Nigerian salary-backed lending. The 33% headroom (minus what's already committed)
   * is converted into a maximum affordable monthly repayment, then grossed up over the
   * product's max tenor to estimate a maximum eligible principal.
   */
  private static readonly MAX_DTI_RATIO = 0.33;

  readonly maxAffordableMonthlyRepayment = computed(() => {
    const salary = this.toNumber(this.monthlySalary());
    const obligations = this.toNumber(this.existingObligations());
    const affordabilityCeiling = salary * EligibilityCalculatorComponent.MAX_DTI_RATIO;
    return Math.max(0, affordabilityCeiling - obligations);
  });

  readonly isEligible = computed(() => this.maxAffordableMonthlyRepayment() > 0);

  readonly rawEligibleAmount = computed(() => {
    const product = this.selectedProduct();
    if (!product) return 0;
    const maxTenorMonths = Number(product.maxTenor) || 12;
    const monthlyRatePct = Number(product.interestRate) || 0;
    const monthlyRate = monthlyRatePct / 100;
    // Flat-rate approximation matching the loan calculator: total repayment spread evenly.
    // affordable_monthly = principal * (1 + monthlyRate * tenor) / tenor
    // => principal = affordable_monthly * tenor / (1 + monthlyRate * tenor)
    const denominator = 1 + monthlyRate * maxTenorMonths;
    return (this.maxAffordableMonthlyRepayment() * maxTenorMonths) / denominator;
  });

  readonly eligibleAmount = computed(() => {
    const product = this.selectedProduct();
    if (!product) return 0;
    const min = this.toNumber(product.minAmount);
    const max = this.toNumber(product.maxAmount);
    return Math.min(max, Math.max(0, this.rawEligibleAmount()));
  });

  readonly meetsMinimum = computed(() => {
    const product = this.selectedProduct();
    if (!product) return false;
    const min = this.toNumber(product.minAmount);
    return this.eligibleAmount() >= min;
  });

  formatCurrency(value: number): string {
    return '₦' + Math.max(0, Math.round(value)).toLocaleString();
  }
}
