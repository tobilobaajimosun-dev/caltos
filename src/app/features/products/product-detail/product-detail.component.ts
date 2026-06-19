import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent, TooltipComponent } from '../../../shared/components';

type DetailTab = 'overview' | 'eligibility' | 'fees' | 'disbursement' | 'legal' | 'activity';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  tab: DetailTab;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, SidebarComponent, TooltipComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent {
  activeTab: DetailTab = 'overview';
  statPeriod: 'today' | 'week' | 'month' | 'all' = 'month';

  readonly product = {
    name: 'Corper Wallet',
    status: 'live' as const,
    createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
    description: 'This loan is for National Youth Service Corps members seeking quick access to personal finance during their service year.',
    websiteLink: 'https://saas.product.com/7pzY',

    // Step 1 – Product Details
    productId: 'CW001',
    minAmount: '20,000',
    maxAmount: '100,000',
    minTenor: '3',
    maxTenor: '12',
    tenorUnit: 'Months',
    interestType: 'Percentage Based',
    interestFrequency: 'Monthly',
    interestRate: '7.5',
    minInterest: '500',
    maxInterest: '5,000',

    // Step 2 – Eligibility
    eligibility: ['Remita', 'IPPIS', 'Salary Earner'],
    activeLoanPolicy: 'Restrict — borrowers with active loans cannot apply',
    kycDocs: ['National ID (NIN)', 'Utility Bill', 'Last 3 months payslip', 'Bank statement (6 months)'],

    // Step 3 – Fees
    processingFee: { enabled: true, method: 'Percentage', value: '1.5%', applyTo: 'Loan Amount', min: '₦750', max: '₦1,550' },
    customFees: [
      { name: 'Admin Fee', method: 'Flat Fee', value: '₦2,500', applyTo: 'Per Loan' },
    ],

    // Step 4 – Disbursement
    offerLetter: 'Digital signature required',
    disburseToSalary: 'Yes',
    autoDeductions: 'No',
    videoConfirmation: 'No',

    // Step 5 – Repayment
    repaymentFrequency: 'Monthly',
    minRepayments: '3',
    maxRepayments: '12',
    firstPaymentOffset: '30 days after disbursement',
    repaymentOrder: ['Fees', 'Interest', 'Penalty', 'Principal'],
    activateImmediately: true,

    // Step 6 – Penalty
    latePenalty: { enabled: true, type: 'Percentage', value: '2%', frequency: 'Daily', gracePeriod: '3 days' },

    // Step 7 – Legal
    policyText: `By submitting your loan application, you acknowledge and agree to the following terms: Princeps Finance may verify information about your employment, salary, loans, and other relevant data from third-party sources to assess your loan eligibility. If your application is approved, loan instalments will be automatically deducted from your salary source before being credited to your account. In case of default, any outstanding balance may be recovered from other linked accounts you own.\n\nYou confirm your acknowledgment and acceptance of our Privacy Policy and Loan Terms and Conditions.`,
  };

  checklist: ChecklistItem[] = [
    { id: 'details',      label: 'Product details',            description: 'Name, amounts, tenor, and interest rate configured',              done: true,  tab: 'overview'     },
    { id: 'eligibility',  label: 'Eligibility & KYC',          description: 'Borrower requirements and required documents defined',             done: false, tab: 'eligibility'  },
    { id: 'fees',         label: 'Fees & penalties',           description: 'Processing fee and late penalty rules set up',                    done: true,  tab: 'fees'         },
    { id: 'disbursement', label: 'Disbursement & repayment',   description: 'Disbursement method and repayment schedule configured',           done: false, tab: 'disbursement' },
    { id: 'integration',  label: 'Integration connection',     description: 'Payment gateway (Remita / NIBSS) linked for auto-deductions',     done: false, tab: 'disbursement' },
    { id: 'target',       label: 'Loan product target',        description: 'Disbursement goal and portfolio cap set for this product',        done: false, tab: 'overview'     },
    { id: 'legal',        label: 'Legal documentation',        description: 'Policy text and borrower consent language added',                 done: true,  tab: 'legal'        },
    { id: 'portal',       label: 'Borrower portal live',       description: 'Product is visible on the public application portal',             done: true,  tab: 'overview'     },
  ];

  setupExpanded = true;

  get completedCount() { return this.checklist.filter(c => c.done).length; }
  get isFullySetup() { return this.completedCount === this.checklist.length; }
  get setupPct() { return Math.round((this.completedCount / this.checklist.length) * 100); }
  get pendingItems() { return this.checklist.filter(c => !c.done); }
  get pendingLabels() { return this.pendingItems.map(i => i.label).join(' · '); }

  setTab(tab: DetailTab) { this.activeTab = tab; }

  goToTab(tab: DetailTab) {
    this.setTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  copyLink() {
    navigator.clipboard.writeText(this.product.websiteLink).catch(() => {});
  }
}
