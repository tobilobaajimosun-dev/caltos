import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { HiIconComponent, IconData } from '../../../../shared/components/hi-icon/hi-icon.component';
import { ButtonComponent } from '../../../../shared/components';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

interface LoanType {
  id: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
  tags: string[];
  detail: string;
  recommendedData: string[];
  verificationNote?: string;
  isScratch?: boolean;
}

const LOAN_TYPES: LoanType[] = [
  {
    id: 'salary', label: 'Salary Advance', desc: 'Short term loans for private salary earners',
    color: '#0BA5EC', bg: '#E0F2FE', tags: ['Bank Statement', 'Direct Debit'],
    detail: 'Perfect for employees who need quick access to their earned wages. Uses salary records to verify income and sets up automatic deductions for repayment.',
    recommendedData: ['Full name', 'BVN', 'Date of birth', 'Employer name', 'Monthly net salary', 'Employment letter', 'Bank statement (3 months)', 'Government-issued ID'],
  },
  {
    id: 'public', label: 'Public Sector Loan', desc: 'Loans for government employees',
    color: '#F79009', bg: '#FEF3C7', tags: ['Remita', 'IPPIS'],
    detail: 'Designed for federal and state civil servants. Verifies employment through IPPIS or Remita, with deductions processed through payroll.',
    recommendedData: ['Full name', 'BVN', 'Date of birth', 'Ministry / department', 'Staff ID', 'IPPIS number', 'Government-issued ID'],
    verificationNote: 'Remita and IPPIS verification require integration keys. Contact your Remita account manager or set up IPPIS access via your NPC portal before publishing.',
  },
  {
    id: 'school', label: 'School Fees Loan', desc: 'Help parents and students pay school fees',
    color: '#12B76A', bg: '#D1FAE5', tags: ['School ID', 'Admission Letter'],
    detail: 'Enables families to pay school fees in advance. Typically requires a guarantor and proof of school admission. Repayment structured around school terms.',
    recommendedData: ['Full name', 'BVN', 'Date of birth', 'School name', 'Student/admission number', 'School ID or admission letter', 'Guarantor form', 'Government-issued ID'],
  },
  {
    id: 'corper', label: 'Corper Loan', desc: 'Loans for NYSC members and corps members',
    color: '#6941C6', bg: '#EDE9FE', tags: ['Remita', 'NYSC ID'],
    detail: 'Quick loans for active NYSC corps members. Verified using NYSC call-up details and monthly allowance from Remita. Tenor capped at service duration.',
    recommendedData: ['Full name', 'BVN', 'Date of birth', 'NYSC call-up number', 'State of deployment', 'NYSC call-up letter', 'Government-issued ID'],
    verificationNote: 'Remita verification requires integration keys. Contact your Remita account manager before publishing to enable live income checks.',
  },
  {
    id: 'sme', label: 'SME Loan', desc: 'Working capital and growth loans for businesses',
    color: '#F04438', bg: '#FEE4E2', tags: ['CAC', 'Bank Statement'],
    detail: 'For registered business owners seeking working capital. Requires CAC registration and 6+ months of business bank statements for income assessment.',
    recommendedData: ['Business name', 'BVN of director', 'Date of incorporation', 'CAC certificate', 'Business bank statement (6 months)', 'Utility bill', 'Government-issued ID of director'],
  },
  {
    id: 'coop', label: 'Cooperative Loan', desc: 'Loans for cooperative society members',
    color: '#0BA5EC', bg: '#E0F2FE', tags: ['Membership Verification'],
    detail: 'Exclusively for active members of a registered cooperative society. Loan size is typically tied to accumulated savings, with repayment collected monthly.',
    recommendedData: ['Full name', 'BVN', 'Date of birth', 'Cooperative society name', 'Membership number', 'Membership certificate', 'Government-issued ID'],
  },
  {
    id: 'bnpl', label: 'Buy Now Pay Later', desc: 'Instant purchase financing for goods and services',
    color: '#D92D20', bg: '#FEE4E2', tags: ['ID Verification', 'Affordability'],
    detail: 'Enables customers to purchase goods or services and pay over time. Funds disburse directly to the merchant. Designed for minimal friction at checkout.',
    recommendedData: ['Full name', 'BVN', 'Phone number', 'Date of birth', 'Government-issued ID'],
  },
  {
    id: 'scratch', label: 'Build from Scratch', desc: 'Create a completely custom loan product',
    color: '#667085', bg: '#F2F4F7', tags: ['Start Blank'],
    detail: 'Start with a blank product and configure every setting from scratch. Best for lenders with unique or non-standard loan products.',
    recommendedData: [],
    isScratch: true,
  },
];

@Component({
  selector: 'app-loan-type-modal',
  standalone: true,
  imports: [HiIconComponent, ButtonComponent],
  templateUrl: './loan-type-modal.component.html',
  styleUrls: ['./loan-type-modal.component.scss'],
})
export class LoanTypeModalComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() typeSelected = new EventEmitter<string>();

  readonly loanTypes = LOAN_TYPES;
  readonly closeIcon: IconData = Cancel01Icon as IconData;

  selectedId: string | null = null;
  view: 'grid' | 'detail' = 'grid';

  constructor(private router: Router) {}

  get selectedType(): LoanType | null {
    return this.loanTypes.find(t => t.id === this.selectedId) ?? null;
  }

  select(id: string) {
    this.selectedId = id;
    this.view = 'detail';
  }

  back() {
    this.view = 'grid';
    this.selectedId = null;
  }

  continue() {
    if (!this.selectedId) return;
    this.typeSelected.emit(this.selectedId);
    if (this.selectedId === 'bnpl') {
      this.router.navigate(['/products/create-bnpl']);
    } else {
      this.router.navigate(['/products/create'], { queryParams: { type: this.selectedId } });
    }
  }

  close() {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }
}
