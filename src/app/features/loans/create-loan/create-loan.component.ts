import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CheckboxComponent, RadioButtonComponent,
  ToggleComponent, TextareaComponent, TemplateCardComponent,
  CollapsibleSectionComponent, CopyUrlFieldComponent, QrCodeComponent,
} from '../../../shared/components';
import { HiIconComponent, IconData } from '../../../shared/components/hi-icon/hi-icon.component';
import { LivePreviewComponent } from './live-preview/live-preview.component';
import {
  UserMultipleIcon, UserAccountIcon, SchoolIcon, BankIcon, HandshakeIcon,
  BriefcaseDollarIcon, CreditCardIcon, RocketIcon,
  FingerPrintIcon, IdCardLanyardIcon,
  SlidersHorizontalIcon, CheckIcon, CogIcon, ColorsIcon, GlobeIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from '@hugeicons/core-free-icons';

export interface LoanConfig {
  template: string;
  name: string;
  description: string;
  targetAudience: string;
  minAmount: string;
  maxAmount: string;
  minTenor: string;
  maxTenor: string;
  tenorUnit: string;
  entryPhone: boolean;
  entryEmail: boolean;
  entryBvn: boolean;
  entryNin: boolean;
  collectPersonal: boolean;
  collectContact: boolean;
  collectEmployment: boolean;
  collectAddress: boolean;
  collectBusiness: boolean;
  returningApplicants: string;
  identityBvn: boolean;
  identityNin: boolean;
  identityPhoneOtp: boolean;
  identityEmailOtp: boolean;
  incomeRemita: boolean;
  incomeIppis: boolean;
  incomeBankStatement: boolean;
  autofill: string;
  interestRate: string;
  interestType: string;
  processingFee: string;
  disburseTo: string;
  repaymentFrequency: string;
  maxActiveLoan: string;
  requireGuarantor: boolean;
  brandColor: string;
  brandName: string;
}

const STEPS = [
  { id: 'template',      label: 'Choose Template',    icon: RocketIcon },
  { id: 'about',         label: 'About this Loan',    icon: IdCardLanyardIcon },
  { id: 'application',   label: 'Application Setup',  icon: CheckIcon },
  { id: 'verification',  label: 'Verification Setup', icon: FingerPrintIcon },
  { id: 'pricing',       label: 'Pricing & Fees',     icon: BriefcaseDollarIcon },
  { id: 'disbursement',  label: 'Disbursement',       icon: BankIcon },
  { id: 'repayment',     label: 'Repayment',          icon: CreditCardIcon },
  { id: 'controls',      label: 'Loan Controls',      icon: SlidersHorizontalIcon },
  { id: 'branding',      label: 'Branding',           icon: ColorsIcon },
  { id: 'publish',       label: 'Publish',            icon: GlobeIcon },
];

const TEMPLATES = [
  { id: 'salary',   label: 'Salary Advance',     icon: UserAccountIcon },
  { id: 'public',   label: 'Public Sector Loan', icon: UserMultipleIcon },
  { id: 'school',   label: 'School Fees Loan',   icon: SchoolIcon },
  { id: 'corper',   label: 'Corper Loan',         icon: HandshakeIcon },
  { id: 'sme',      label: 'SME Loan',           icon: BriefcaseDollarIcon },
  { id: 'coop',     label: 'Cooperative Loan',   icon: UserMultipleIcon },
  { id: 'bnpl',     label: 'BNPL',               icon: CreditCardIcon },
  { id: 'scratch',  label: 'Build from Scratch', icon: CogIcon, isScratch: true },
];

@Component({
  selector: 'app-create-loan',
  standalone: true,
  imports: [
    FormsModule, RouterLink, HiIconComponent,
    CheckboxComponent, RadioButtonComponent, ToggleComponent,
    TextareaComponent, TemplateCardComponent, CollapsibleSectionComponent,
    CopyUrlFieldComponent, QrCodeComponent, LivePreviewComponent,
  ],
  templateUrl: './create-loan.component.html',
  styleUrls: ['./create-loan.component.scss'],
})
export class CreateLoanComponent {
  readonly steps = STEPS;
  readonly templates = TEMPLATES;
  currentStep = 0;

  // icon refs
  readonly chevronLeft: IconData = ChevronLeftIcon as IconData;
  readonly chevronRight: IconData = ChevronRightIcon as IconData;

  // template icons (for step nav)
  readonly stepIconMap: Record<string, IconData> = STEPS.reduce((m, s) => ({ ...m, [s.id]: s.icon as IconData }), {});

  // section expand states (step 3)
  expandPersonal = true;
  expandContact = false;
  expandEmployment = false;
  expandAddress = false;
  expandBusiness = false;

  config: LoanConfig = {
    template: '', name: '', description: '', targetAudience: '',
    minAmount: '', maxAmount: '', minTenor: '', maxTenor: '', tenorUnit: 'Months',
    entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
    collectPersonal: true, collectContact: true, collectEmployment: false,
    collectAddress: false, collectBusiness: false, returningApplicants: 'continue',
    identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
    incomeRemita: false, incomeIppis: false, incomeBankStatement: false,
    autofill: 'fill-allow', interestRate: '', interestType: 'Reducing Balance',
    processingFee: '', disburseTo: 'bank', repaymentFrequency: 'Monthly',
    maxActiveLoan: '1', requireGuarantor: false, brandColor: '#0053a6', brandName: '',
  };

  readonly tenorUnits = ['Days', 'Weeks', 'Months', 'Years'];
  readonly repayFreqs = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'At end of tenor'];
  readonly interestTypes = ['Reducing Balance', 'Flat Rate'];

  get stepId() { return this.steps[this.currentStep].id; }
  get isFirst() { return this.currentStep === 0; }
  get isLast() { return this.currentStep === this.steps.length - 1; }

  stepStatus(i: number): 'active' | 'done' | 'upcoming' {
    if (i === this.currentStep) return 'active';
    return i < this.currentStep ? 'done' : 'upcoming';
  }

  next() { if (!this.isLast) this.currentStep++; }
  back() { if (!this.isFirst) this.currentStep--; }
  goToStep(i: number) { if (i <= this.currentStep) this.currentStep = i; }

  selectTemplate(id: string) { this.config.template = id; }

  get nextLabel(): string {
    const labels: Record<string, string> = {
      template: 'Set up your loan',
      about: 'Configure application',
      application: 'Set up verification',
      verification: 'Set pricing',
      pricing: 'Configure disbursement',
      disbursement: 'Set up repayment',
      repayment: 'Configure controls',
      controls: 'Add branding',
      branding: 'Preview & publish',
      publish: 'Publish loan',
    };
    return labels[this.stepId] || 'Continue';
  }

  get backLabel(): string {
    const labels: Record<string, string> = {
      about: 'Back to templates',
      application: 'Back to loan details',
      verification: 'Back to application setup',
      pricing: 'Back to verification',
      disbursement: 'Back to pricing',
      repayment: 'Back to disbursement',
      controls: 'Back to repayment',
      branding: 'Back to loan controls',
      publish: 'Back to branding',
    };
    return labels[this.stepId] || 'Back';
  }

  get publishUrl(): string {
    const slug = (this.config.name || 'my-loan').toLowerCase().replace(/\s+/g, '-');
    return `https://apply.caltos.co/${slug}`;
  }
}
