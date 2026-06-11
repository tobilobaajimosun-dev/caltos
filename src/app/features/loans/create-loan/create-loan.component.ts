import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import {
  SidebarComponent, CheckboxComponent, RadioButtonComponent,
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

export const STEPS = [
  { id: 'template',     label: 'Template',           shortLabel: 'Template' },
  { id: 'about',        label: 'About Loan',         shortLabel: 'About Loan' },
  { id: 'application',  label: 'Application Setup',  shortLabel: 'Application' },
  { id: 'verification', label: 'Verification Setup', shortLabel: 'Verification' },
  { id: 'pricing',      label: 'Pricing & Fees',     shortLabel: 'Pricing' },
  { id: 'disbursement', label: 'Disbursement',       shortLabel: 'Disbursement' },
  { id: 'repayment',    label: 'Repayment',          shortLabel: 'Repayment' },
  { id: 'controls',     label: 'Loan Controls',      shortLabel: 'Loan Controls' },
  { id: 'branding',     label: 'Branding',           shortLabel: 'Branding' },
  { id: 'publish',      label: 'Notifications',      shortLabel: 'Notifications' },
];

export const TEMPLATES = [
  {
    id: 'salary', label: 'Salary Advance',
    description: 'Short term loans for private salary earners.',
    color: '#0BA5EC', bg: '#E0F2FE',
    tags: ['Bank Statement', 'Direct Debit'],
    icon: UserAccountIcon,
  },
  {
    id: 'public', label: 'Public Sector Loan',
    description: 'Loans for government employees.',
    color: '#F79009', bg: '#FEF3C7',
    tags: ['Remita', 'IPPIS'],
    icon: UserMultipleIcon,
  },
  {
    id: 'school', label: 'School Fees Loan',
    description: 'Help parents and students pay school fees.',
    color: '#12B76A', bg: '#D1FAE5',
    tags: ['School ID', 'Admission Letter'],
    icon: SchoolIcon,
  },
  {
    id: 'corper', label: 'Corper Loan',
    description: 'Loans for NYSC members and corps employers.',
    color: '#6941C6', bg: '#EDE9FE',
    tags: ['Remita', 'NYSC ID'],
    icon: HandshakeIcon,
  },
  {
    id: 'sme', label: 'SME Loan',
    description: 'Working capital and growth loans for businesses.',
    color: '#F04438', bg: '#FEE4E2',
    tags: ['CAC', 'Bank Statement'],
    icon: BriefcaseDollarIcon,
  },
  {
    id: 'coop', label: 'Cooperative Loan',
    description: 'Loans for cooperative society members.',
    color: '#0BA5EC', bg: '#E0F2FE',
    tags: ['Membership Verification'],
    icon: UserMultipleIcon,
  },
  {
    id: 'bnpl', label: 'Buy Now Pay Later',
    description: 'Instant purchase financing for goods and services.',
    color: '#F04438', bg: '#FEE4E2',
    tags: ['ID Verification', 'Affordability'],
    icon: CreditCardIcon,
  },
  {
    id: 'scratch', label: 'Build from Scratch',
    description: 'Create a completely custom loan product.',
    color: '#667085', bg: '#F2F4F7',
    tags: ['Start Blank'],
    isScratch: true,
    icon: CogIcon,
  },
];

const BORROWER_STEPS = [
  { label: 'Contact Information', sub: 'We\'ll ask for their phone or email' },
  { label: 'Verify Identity', sub: 'We\'ll verify their identity' },
  { label: 'Confirm Employment', sub: 'We\'ll confirm their employment or income' },
  { label: 'Upload Documents', sub: 'They\'ll upload required documents' },
  { label: 'Review & Submit', sub: 'They\'ll review and submit their application' },
];

@Component({
  selector: 'app-create-loan',
  standalone: true,
  imports: [
    FormsModule, RouterLink, TitleCasePipe, SidebarComponent, HiIconComponent,
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
  readonly borrowerSteps = BORROWER_STEPS;
  currentStep = 0;

  readonly chevronLeft: IconData = ChevronLeftIcon as IconData;
  readonly chevronRight: IconData = ChevronRightIcon as IconData;

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
    maxActiveLoan: '1', requireGuarantor: false, brandColor: '#6941C6', brandName: '',
  };

  readonly tenorUnits = ['Days', 'Weeks', 'Months', 'Years'];
  readonly repayFreqs = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'At end of tenor'];
  readonly interestTypes = ['Reducing Balance', 'Flat Rate'];

  get stepId() { return this.steps[this.currentStep].id; }
  get isFirst() { return this.currentStep === 0; }
  get isLast() { return this.currentStep === this.steps.length - 1; }
  get stepNumber() { return this.currentStep + 1; }

  stepStatus(i: number): 'active' | 'done' | 'upcoming' {
    if (i === this.currentStep) return 'active';
    return i < this.currentStep ? 'done' : 'upcoming';
  }

  next() { if (!this.isLast) this.currentStep++; }
  back() { if (!this.isFirst) this.currentStep--; }
  goToStep(i: number) { this.currentStep = i; }
  selectTemplate(id: string) { this.config.template = id; }

  getConfig(key: string): unknown {
    return (this.config as unknown as Record<string, unknown>)[key];
  }

  toggleEntry(key: string) {
    const rec = this.config as unknown as Record<string, unknown>;
    rec[key] = !rec[key];
  }

  setConfig(key: string, value: unknown) {
    (this.config as unknown as Record<string, unknown>)[key] = value;
  }

  get selectedTemplate() {
    return TEMPLATES.find(t => t.id === this.config.template);
  }

  get nextLabel(): string {
    if (this.isLast) return 'Review & Publish';
    return 'Save & Continue';
  }

  get stepTitle(): string {
    const titles: Record<string, string> = {
      template: 'Create a Loan Product',
      about: 'About this Loan',
      application: 'Application Setup',
      verification: 'Verification Setup',
      pricing: 'Pricing & Fees',
      disbursement: 'Disbursement',
      repayment: 'Repayment',
      controls: 'Loan Controls',
      branding: 'Branding & Customization',
      publish: 'Notifications',
    };
    return titles[this.stepId] || '';
  }

  get stepSubtitle(): string {
    const subs: Record<string, string> = {
      template: 'Launch your loan in 10 simple steps',
      about: 'Tell us about the loan you want to offer.',
      application: 'Choose the information you want to collect from applicants.',
      verification: 'Select the methods you want to use to verify your applicants.',
      pricing: 'Configure interest rate and other charges for this loan.',
      disbursement: 'Define how and when loans should be disbursed.',
      repayment: 'Set up how your customers will repay this loan.',
      controls: 'Set limits and targets for this loan product.',
      branding: 'Customize the look and feel of your loan product.',
      publish: 'Set up how you want to communicate with your customers.',
    };
    return subs[this.stepId] || '';
  }

  get publishUrl(): string {
    const slug = (this.config.name || 'my-loan').toLowerCase().replace(/\s+/g, '-');
    return `https://apply.caltos.co/${slug}`;
  }

  get templateIconData(): Record<string, IconData> {
    return TEMPLATES.reduce((m, t) => ({ ...m, [t.id]: t.icon as IconData }), {});
  }
}
