import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  KpiCardComponent,
  AvatarComponent,
  DrawerComponent,
  ModalComponent,
  SelectComponent,
  SelectOption,
  InputComponent,
  TextareaComponent,
  CheckboxComponent,
  RadioButtonComponent,
  ButtonComponent,
  StatusBadgeComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
} from '../../../shared/components';

type Stage = 'review' | 'credit' | 'approval' | 'offer' | 'disbursement' | 'disbursed' | 'rejected';
type OfferStatus = 'not-sent' | 'sent' | 'signed' | 'expired';
type ApprovalStatus = 'approved' | 'pending' | 'rejected';

interface ChecklistState {
  bvn: boolean;
  kyc: boolean;
  eligibility: boolean;
  activeLoanCheck: boolean;
  creditComplete: boolean;
}

interface CreditData {
  employer: string;
  netSalary: number;
  existingDeductions: number;
  availableSalary: number;
  maxLoanAmount: number;
  dsr: number;
  affordabilityScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  overrideReason: string;
}

interface ApprovalStep {
  approver: string;
  status: ApprovalStatus;
  comment?: string;
}

interface Application {
  id: string;
  customer: string;
  product: string;
  amount: number;
  tenor: number;
  stage: Stage;
  checklist: ChecklistState;
  officerNotes: string;
  credit: CreditData;
  approvalChain: ApprovalStep[];
  offerStatus: OfferStatus;
  disbursementMethod: 'salary' | 'custom';
  disbursementError: string | null;
  rejectionReason?: string;
  returnComment?: string;
}

@Component({
  selector: 'app-loan-processing',
  standalone: true,
  imports: [
    KpiCardComponent, AvatarComponent, DrawerComponent, ModalComponent, SelectComponent,
    InputComponent, TextareaComponent, CheckboxComponent, RadioButtonComponent, ButtonComponent,
    StatusBadgeComponent, RoundTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-processing.component.html',
  styleUrl: './loan-processing.component.scss',
})
export class LoanProcessingComponent {
  readonly mainTabs: Tab[] = [
    { label: 'Pipeline', value: 'pipeline' },
    { label: 'Approval Settings', value: 'settings' },
  ];
  readonly mainTab = signal('pipeline');
  setMainTab(v: string) {
    this.mainTab.set(v);
  }

  readonly stageColumns: { stage: Stage; label: string }[] = [
    { stage: 'review', label: 'Pending Review' },
    { stage: 'credit', label: 'Credit Assessment' },
    { stage: 'approval', label: 'Approval' },
    { stage: 'offer', label: 'Offer Letter' },
    { stage: 'disbursement', label: 'Disbursement' },
  ];

  readonly productOptions: SelectOption[] = [
    { value: 'Salary Advance', label: 'Salary Advance' },
    { value: 'Corper Wallet', label: 'Corper Wallet' },
    { value: 'Credit Wallet', label: 'Credit Wallet' },
  ];

  readonly applications = signal<Application[]>([
    {
      id: 'APP-1001', customer: 'Ngozi Umeh', product: 'Salary Advance', amount: 180_000, tenor: 6, stage: 'review',
      checklist: { bvn: true, kyc: true, eligibility: true, activeLoanCheck: true, creditComplete: false },
      officerNotes: '',
      credit: { employer: 'Federal Ministry of Health', netSalary: 280_000, existingDeductions: 40_000, availableSalary: 240_000, maxLoanAmount: 220_000, dsr: 33, affordabilityScore: 78, riskLevel: 'Low', overrideReason: '' },
      approvalChain: [{ approver: 'T. Adeyemi (Officer)', status: 'pending' }],
      offerStatus: 'not-sent', disbursementMethod: 'salary', disbursementError: null,
    },
    {
      id: 'APP-1002', customer: 'Kelechi Anya', product: 'Credit Wallet', amount: 320_000, tenor: 9, stage: 'credit',
      checklist: { bvn: true, kyc: true, eligibility: true, activeLoanCheck: true, creditComplete: false },
      officerNotes: 'All KYC docs verified, awaiting credit assessment.',
      credit: { employer: 'Lagos State Government', netSalary: 410_000, existingDeductions: 90_000, availableSalary: 320_000, maxLoanAmount: 300_000, dsr: 41, affordabilityScore: 64, riskLevel: 'Medium', overrideReason: '' },
      approvalChain: [{ approver: 'T. Adeyemi (Officer)', status: 'approved' }, { approver: 'B. Nwachukwu (Manager)', status: 'pending' }],
      offerStatus: 'not-sent', disbursementMethod: 'salary', disbursementError: null,
    },
    {
      id: 'APP-1003', customer: 'Segun Owolabi', product: 'Corper Wallet', amount: 60_000, tenor: 3, stage: 'approval',
      checklist: { bvn: true, kyc: true, eligibility: true, activeLoanCheck: true, creditComplete: true },
      officerNotes: 'Fast-tracked — corps member with strong Remita history.',
      credit: { employer: 'NYSC', netSalary: 33_000, existingDeductions: 0, availableSalary: 33_000, maxLoanAmount: 80_000, dsr: 18, affordabilityScore: 88, riskLevel: 'Low', overrideReason: '' },
      approvalChain: [{ approver: 'T. Adeyemi (Officer)', status: 'approved' }, { approver: 'B. Nwachukwu (Manager)', status: 'pending' }],
      offerStatus: 'not-sent', disbursementMethod: 'salary', disbursementError: null,
    },
    {
      id: 'APP-1004', customer: 'Aisha Lawal', product: 'Salary Advance', amount: 150_000, tenor: 6, stage: 'offer',
      checklist: { bvn: true, kyc: true, eligibility: true, activeLoanCheck: true, creditComplete: true },
      officerNotes: '',
      credit: { employer: 'Nigeria Police Force', netSalary: 220_000, existingDeductions: 20_000, availableSalary: 200_000, maxLoanAmount: 180_000, dsr: 25, affordabilityScore: 82, riskLevel: 'Low', overrideReason: '' },
      approvalChain: [{ approver: 'T. Adeyemi (Officer)', status: 'approved' }, { approver: 'B. Nwachukwu (Manager)', status: 'approved' }],
      offerStatus: 'sent', disbursementMethod: 'salary', disbursementError: null,
    },
    {
      id: 'APP-1005', customer: 'Yusuf Danladi', product: 'Credit Wallet', amount: 95_000, tenor: 6, stage: 'disbursement',
      checklist: { bvn: true, kyc: true, eligibility: true, activeLoanCheck: true, creditComplete: true },
      officerNotes: '',
      credit: { employer: 'Private sector', netSalary: 190_000, existingDeductions: 15_000, availableSalary: 175_000, maxLoanAmount: 160_000, dsr: 28, affordabilityScore: 75, riskLevel: 'Low', overrideReason: '' },
      approvalChain: [{ approver: 'T. Adeyemi (Officer)', status: 'approved' }, { approver: 'B. Nwachukwu (Manager)', status: 'approved' }],
      offerStatus: 'signed', disbursementMethod: 'salary', disbursementError: null,
    },
  ]);

  applicationsIn(stage: Stage): Application[] {
    return this.applications().filter((a) => a.stage === stage);
  }

  readonly disbursedCount = computed(() => this.applications().filter((a) => a.stage === 'disbursed').length);
  readonly rejectedCount = computed(() => this.applications().filter((a) => a.stage === 'rejected').length);

  riskColor(level: 'Low' | 'Medium' | 'High'): string {
    if (level === 'Low') return 'var(--color-success)';
    if (level === 'Medium') return 'var(--color-warning)';
    return 'var(--color-error)';
  }

  private update(id: string, fn: (a: Application) => Application) {
    this.applications.update((all) => all.map((a) => (a.id === id ? fn(a) : a)));
    const updated = this.applications().find((a) => a.id === id) ?? null;
    this.selected.set(updated);
  }

  // ── Selection / drawer ──
  readonly selected = signal<Application | null>(null);
  readonly returnComment = signal('');
  readonly rejectReason = signal('');
  readonly showRejectForm = signal(false);

  open(app: Application) {
    this.returnComment.set('');
    this.rejectReason.set('');
    this.showRejectForm.set(false);
    this.selected.set(app);
  }

  close() {
    this.selected.set(null);
  }

  toggleChecklistItem(app: Application, key: keyof ChecklistState, value: boolean) {
    this.update(app.id, (a) => ({ ...a, checklist: { ...a.checklist, [key]: value } }));
  }

  setOfficerNotes(app: Application, notes: string) {
    this.update(app.id, (a) => ({ ...a, officerNotes: notes }));
  }

  get allChecklistDone() {
    const app = this.selected();
    if (!app) return false;
    const { bvn, kyc, eligibility, activeLoanCheck } = app.checklist;
    return bvn && kyc && eligibility && activeLoanCheck;
  }

  approveForNextLevel(app: Application) {
    this.update(app.id, (a) => ({ ...a, stage: 'credit' }));
  }

  returnWithComments(app: Application) {
    this.update(app.id, (a) => ({ ...a, returnComment: this.returnComment(), stage: 'review' }));
    this.returnComment.set('');
  }

  rejectApplication(app: Application) {
    this.update(app.id, (a) => ({ ...a, stage: 'rejected', rejectionReason: this.rejectReason() }));
    this.showRejectForm.set(false);
  }

  setOverrideReason(app: Application, reason: string) {
    this.update(app.id, (a) => ({ ...a, credit: { ...a.credit, overrideReason: reason } }));
  }

  completeCreditAssessment(app: Application) {
    this.update(app.id, (a) => ({ ...a, stage: 'approval', checklist: { ...a.checklist, creditComplete: true } }));
  }

  approveAtCurrentLevel(app: Application) {
    this.update(app.id, (a) => {
      const chain = a.approvalChain.map((step, i) => {
        const firstPending = a.approvalChain.findIndex((s) => s.status === 'pending');
        return i === firstPending ? { ...step, status: 'approved' as ApprovalStatus } : step;
      });
      const allApproved = chain.every((s) => s.status === 'approved');
      return { ...a, approvalChain: chain, stage: allApproved ? 'offer' : 'approval' };
    });
  }

  rejectAtApproval(app: Application) {
    this.update(app.id, (a) => {
      const firstPending = a.approvalChain.findIndex((s) => s.status === 'pending');
      const chain = a.approvalChain.map((step, i) => (i === firstPending ? { ...step, status: 'rejected' as ApprovalStatus } : step));
      return { ...a, approvalChain: chain, stage: 'rejected', rejectionReason: this.rejectReason() };
    });
    this.showRejectForm.set(false);
  }

  sendOfferLetter(app: Application) {
    this.update(app.id, (a) => ({ ...a, offerStatus: 'sent' }));
  }

  markSigned(app: Application) {
    this.update(app.id, (a) => ({ ...a, offerStatus: 'signed', stage: 'disbursement' }));
  }

  setDisbursementMethod(app: Application, method: 'salary' | 'custom') {
    this.update(app.id, (a) => ({ ...a, disbursementMethod: method }));
  }

  disburseNow(app: Application) {
    if (app.amount > 500_000) {
      this.update(app.id, (a) => ({ ...a, disbursementError: 'Insufficient wallet balance for this disbursement.' }));
      return;
    }
    this.update(app.id, (a) => ({ ...a, stage: 'disbursed', disbursementError: null }));
  }

  // ── New application intake ──
  showIntakeModal = signal(false);
  intakeStep = signal(0);
  intakeCustomer = signal('');
  intakeProduct = signal('Salary Advance');
  intakeAmount = signal('');
  intakeTenor = signal('6');

  openIntake() {
    this.intakeStep.set(0);
    this.intakeCustomer.set('');
    this.intakeProduct.set('Salary Advance');
    this.intakeAmount.set('');
    this.intakeTenor.set('6');
    this.showIntakeModal.set(true);
  }

  intakeNext() {
    if (this.intakeStep() < 3) this.intakeStep.update((s) => s + 1);
  }

  intakeBack() {
    if (this.intakeStep() > 0) this.intakeStep.update((s) => s - 1);
  }

  submitIntake() {
    const id = `APP-${1006 + this.applications().length}`;
    const newApp: Application = {
      id, customer: this.intakeCustomer() || 'New Applicant', product: this.intakeProduct(),
      amount: Number(this.intakeAmount()) || 0, tenor: Number(this.intakeTenor()) || 6, stage: 'review',
      checklist: { bvn: false, kyc: false, eligibility: false, activeLoanCheck: false, creditComplete: false },
      officerNotes: '',
      credit: { employer: '', netSalary: 0, existingDeductions: 0, availableSalary: 0, maxLoanAmount: 0, dsr: 0, affordabilityScore: 0, riskLevel: 'Medium', overrideReason: '' },
      approvalChain: [{ approver: 'T. Adeyemi (Officer)', status: 'pending' }],
      offerStatus: 'not-sent', disbursementMethod: 'salary', disbursementError: null,
    };
    this.applications.update((all) => [newApp, ...all]);
    this.showIntakeModal.set(false);
  }

  // ── Approval settings ──
  approvalLevel = signal<'none' | 'single' | 'dual' | 'committee'>('dual');
  escalationHours = signal('24');
}
