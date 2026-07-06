import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { KpiCardComponent, InputComponent, SelectComponent, SelectOption } from '../../../shared/components';

type InterestModel = 'Flat Rate' | 'Reducing Balance' | 'Percentage Based';

@Component({
  selector: 'app-loan-calculator',
  imports: [KpiCardComponent, InputComponent, SelectComponent, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-calculator.component.html',
  styleUrl: './loan-calculator.component.scss',
})
export class LoanCalculatorComponent {
  readonly amount = signal('100000');
  readonly tenorValue = signal('12');
  readonly tenorUnit = signal('Months');
  readonly interestModel = signal<InterestModel>('Flat Rate');
  readonly interestRate = signal('7.5');
  readonly chargeFrequency = signal('Monthly');

  // Reused from create-loan.component.ts for consistency across the app.
  readonly tenorUnits: SelectOption[] = ['Days', 'Weeks', 'Months', 'Years'].map((u) => ({ value: u, label: u }));
  readonly interestModels: SelectOption[] = ['Flat Rate', 'Reducing Balance', 'Percentage Based'].map((m) => ({ value: m, label: m }));
  readonly interestChargePeriods: SelectOption[] = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'One Time'].map((p) => ({ value: p, label: p }));

  private readonly principal = computed(() => Number(this.amount()) || 0);
  private readonly periods = computed(() => Math.max(1, Number(this.tenorValue()) || 1));
  private readonly rate = computed(() => (Number(this.interestRate()) || 0) / 100);

  /**
   * Simplified repayment math — this is a demo/internal estimation tool, not a precise
   * amortization engine.
   *
   * Flat Rate: interest is charged once per period on the full original principal for
   * every period of the tenor, then principal + total interest is spread evenly.
   *
   * Reducing Balance: approximated by charging interest on the average outstanding
   * balance (principal / 2) across the tenor, rather than running a full per-period
   * amortization schedule.
   *
   * Percentage Based: a flat one-time percentage fee added to the principal, spread
   * evenly across the tenor.
   */
  readonly totalRepayment = computed(() => {
    const principal = this.principal();
    const periods = this.periods();
    const rate = this.rate();

    if (this.interestModel() === 'Reducing Balance') {
      const totalInterest = (principal / 2) * rate * periods;
      return principal + totalInterest;
    }
    if (this.interestModel() === 'Percentage Based') {
      const totalInterest = principal * rate;
      return principal + totalInterest;
    }
    // Flat Rate (default): principal + principal × rate × periods
    const totalInterest = principal * rate * periods;
    return principal + totalInterest;
  });

  readonly totalInterest = computed(() => this.totalRepayment() - this.principal());

  readonly periodicRepayment = computed(() => this.totalRepayment() / this.periods());

  readonly periodLabel = computed(() => {
    const unit = this.tenorUnit();
    if (unit === 'Days') return 'daily';
    if (unit === 'Weeks') return 'weekly';
    if (unit === 'Years') return 'yearly';
    return 'monthly';
  });

  formatCurrency(value: number): string {
    return '₦' + Math.max(0, Math.round(value)).toLocaleString();
  }
}
