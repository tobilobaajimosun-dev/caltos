import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CheckboxComponent,
  RadioButtonComponent,
  ToggleComponent,
  ButtonComponent,
} from '../../../shared/components';
import { AddPenaltyModalComponent, PenaltyEntry } from './add-penalty-modal/add-penalty-modal.component';
import { AddCustomFeeModalComponent, CustomFee } from './add-custom-fee-modal/add-custom-fee-modal.component';

interface FeeEntry {
  id: string;
  name: string;
  enabled: boolean;
  method: string;
  value: string;
  minAmount: string;
  maxAmount: string;
  applyTo: string;
}

interface PenaltyItem extends PenaltyEntry {
  id: string;
}

const STEPS = [
  { id: 'product-details', label: 'Product details' },
  { id: 'eligibility', label: 'Eligibility & KYC requirements' },
  { id: 'fees', label: 'Fees set up' },
  { id: 'disbursement', label: 'Disbursement' },
  { id: 'repayment', label: 'Repayment set up' },
  { id: 'penalty', label: 'Penalty set up' },
  { id: 'legal', label: 'Legal' },
  { id: 'customization', label: 'Customization' },
  { id: 'notifications', label: 'Notification Settings' },
];

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    CheckboxComponent, RadioButtonComponent, ToggleComponent,
    AddPenaltyModalComponent, AddCustomFeeModalComponent, ButtonComponent,
  ],
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.scss'],
})
export class CreateProductComponent {
  readonly steps = STEPS;
  readonly interestFreqs = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'One-time'];
  readonly repaymentFreqs = ['Weekly', 'Monthly', 'Bi-monthly', 'Quarterly', 'Yearly', 'At end of tenor'];
  readonly tenorUnits = ['Days', 'Month', 'Years'];

  currentStep = 0;

  // Step 1 – Product Details
  productName = '';
  productId = '';
  productDescription = '';
  minLoanAmount = '';
  maxLoanAmount = '';
  minTenorValue = '';
  minTenorUnit = 'Days';
  maxTenorValue = '';
  maxTenorUnit = 'Days';
  interestFrequency = 'Monthly';
  interestType = 'Percentage Based';
  interestRate = '';
  includeMinMax = false;
  minInterestAmount = '';
  maxInterestAmount = '';

  // Step 2 – Eligibility & KYC
  eligRemita = false;
  eligIppis = false;
  eligSalary = false;
  eligBankStatement = false;
  activeLoanOption = 'restrict';
  kycNin = false;
  kycCac = false;
  kycUtilityBill = false;
  kycEmployerLetter = false;
  kycPaySlip = false;
  kycPassport = false;

  // Step 3 – Fees
  processingFeeEnabled = false;
  processingFeeMethod = 'Percentage';
  processingFeeValue = '';
  processingFeeApplyTo = 'Interest';
  processingFeeMin = '';
  processingFeeMax = '';
  customFees: FeeEntry[] = [];
  showCustomFeeModal = false;

  // Step 4 – Disbursement
  offerLetterOption = 'none';
  disburseSalaryAccount = 'yes';
  autoRepaymentDeductions = 'no';
  videoConfirmation = 'no';

  // Step 5 – Repayment
  repaymentFrequency = 'Monthly';
  minRepayments = '';
  maxRepayments = '';
  firstPaymentOffset = '';
  repaymentOrder = ['Fees', 'Interest', 'Penalty', 'Principal'];
  activateImmediately = false;

  // Step 6 – Penalty
  latePenaltyEnabled = false;
  penalties: PenaltyItem[] = [];
  showPenaltyModal = false;

  // Step 7 – Legal
  policyText = `By submitting your loan application, you acknowledge and agree to the following terms: [Organisation Name] may verify information about my employment, salary, loans, and other relevant data from third-party sources to assess my loan eligibility. If my application is approved, loan instalments will be automatically deducted from my salary source before being credited to my account. In case of default, any outstanding balance may be recovered from other linked accounts I own.

Your consent is required for the [Product name] Loan Application process, information verification methods, and automatic deductions. You can check the box below. Additionally, you confirm your acknowledgment and acceptance of our [Privacy Policy] and [Loan Terms and Conditions], which can be reviewed through the provided links.`;

  get stepId() { return this.steps[this.currentStep].id; }
  get isFirst() { return this.currentStep === 0; }
  get isLast() { return this.currentStep === this.steps.length - 1; }

  stepStatus(i: number): 'active' | 'done' | 'upcoming' {
    if (i === this.currentStep) return 'active';
    return i < this.currentStep ? 'done' : 'upcoming';
  }

  goToStep(i: number) { if (i <= this.currentStep) this.currentStep = i; }
  next() { if (!this.isLast) this.currentStep++; }
  back() { if (!this.isFirst) this.currentStep--; }

  nextLabel(): string {
    const map: Record<string, string> = {
      'product-details': 'Proceed to eligibility & KYC requirement',
      'eligibility': 'Proceed to fees setup',
      'fees': 'Proceed to disbursement',
      'disbursement': 'Proceed to repayment setup',
      'repayment': 'Proceed to penalty set up',
      'penalty': 'Proceed to legal documentation',
      'legal': 'Proceed to customization',
      'customization': 'Proceed to notification settings',
      'notifications': 'Create product',
    };
    return map[this.stepId] || 'Next';
  }

  backLabel(): string {
    const map: Record<string, string> = {
      'eligibility': 'Back to product details',
      'fees': 'Back to eligibility',
      'disbursement': 'Back to fees setup',
      'repayment': 'Back to disbursement',
      'penalty': 'Back to repayment setup',
      'legal': 'Back to Penalty',
      'customization': 'Back to legal',
      'notifications': 'Back to customization',
    };
    return map[this.stepId] || 'Back';
  }

  onCustomFeeAdded(fee: CustomFee) {
    this.customFees.push({
      id: Date.now().toString(),
      name: fee.name, enabled: true, method: fee.method,
      value: fee.amount, minAmount: '', maxAmount: '', applyTo: fee.applyTo,
    });
  }

  removeCustomFee(id: string) { this.customFees = this.customFees.filter(f => f.id !== id); }

  onPenaltyAdded(entry: PenaltyEntry) {
    this.penalties.push({ ...entry, id: Date.now().toString() });
  }

  removePenalty(id: string) { this.penalties = this.penalties.filter(p => p.id !== id); }
}
