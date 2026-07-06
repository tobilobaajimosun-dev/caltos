import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  ColumnTitleComponent,
  TableItemComponent,
  TableItemUser,
  StatusBadgeComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
  DrawerComponent,
  ModalComponent,
  SelectComponent,
  SelectOption,
  InputComponent,
  TextareaComponent,
  ButtonComponent,
  CheckboxComponent,
  RadioButtonComponent,
} from '../../shared/components';

type ParBucket = '1-30' | '31-60' | '61-90' | '90+';
type CollectionsStage = 'overdue' | 'contacted' | 'promise-to-pay' | 'partial-payment' | 'resolved' | 'written-off';

interface OverdueLoan {
  loanId: string;
  customer: TableItemUser;
  product: string;
  overdueSinceDate: string;
  overdueSinceDays: number;
  bucket: ParBucket;
  overdueAmount: number;
  outstandingPrincipal: number;
  lastPayment: string;
  lastContact: { date: string; method: string } | null;
  stage: CollectionsStage;
  officer: string;
  selected?: boolean;
  promiseAmount?: number;
  promiseDate?: string;
  promiseFulfilled?: boolean;
}

interface ContactLogEntry {
  date: string;
  method: string;
  outcome: string;
  nextAction: string;
  officer: string;
}

interface MonthlyPar {
  month: string;
  b1: number;
  b30: number;
  b60: number;
  b90: number;
}

@Component({
  selector: 'app-risk-monitor',
  standalone: true,
  imports: [
    ColumnTitleComponent, TableItemComponent, StatusBadgeComponent,
    RoundTabsComponent, DrawerComponent, ModalComponent, SelectComponent, InputComponent,
    TextareaComponent, ButtonComponent, CheckboxComponent, RadioButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './risk-monitor.component.html',
  styleUrl: './risk-monitor.component.scss',
})
export class RiskMonitorComponent {
  readonly mainTabs: Tab[] = [
    { label: 'Overview', value: 'overview' },
    { label: 'Overdue Loans', value: 'overdue' },
    { label: 'Risk Settings', value: 'settings' },
  ];
  readonly mainTab = signal('overview');
  setMainTab(v: string) {
    this.mainTab.set(v);
  }

  // ── Overview data ──
  readonly parKpis = [
    { label: 'PAR 1 (1–30 days)', value: 214, color: 'var(--color-warning)' },
    { label: 'PAR 30 (31–60 days)', value: 96, color: '#f97316' },
    { label: 'PAR 60 (61–90 days)', value: 41, color: '#c2410c' },
    { label: 'PAR 90 (90+ days)', value: 23, color: 'var(--color-error)' },
  ];
  readonly totalNplValue = '₦81,350,000';
  readonly collectionRate30d = '76.3%';

  readonly parAging: MonthlyPar[] = [
    { month: 'Feb', b1: 180, b30: 70, b60: 30, b90: 15 },
    { month: 'Mar', b1: 190, b30: 78, b60: 32, b90: 17 },
    { month: 'Apr', b1: 205, b30: 85, b60: 35, b90: 19 },
    { month: 'May', b1: 198, b30: 90, b60: 38, b90: 21 },
    { month: 'Jun', b1: 220, b30: 92, b60: 40, b90: 22 },
    { month: 'Jul', b1: 214, b30: 96, b60: 41, b90: 23 },
  ];
  readonly parAgingMax = computed(() => Math.max(...this.parAging.map((m) => m.b1 + m.b30 + m.b60 + m.b90)));

  readonly funnelStages: { stage: string; count: number; amount: number }[] = [
    { stage: 'Overdue', count: 374, amount: 81_350_000 },
    { stage: 'Contacted', count: 290, amount: 62_400_000 },
    { stage: 'Promise to Pay', count: 140, amount: 31_200_000 },
    { stage: 'Partial Payment', count: 88, amount: 18_600_000 },
    { stage: 'Resolved / Written Off', count: 52, amount: 9_800_000 },
  ];
  readonly funnelMax = this.funnelStages[0].count;

  // ── Overdue loans table ──
  readonly bucketTabs: Tab[] = [
    { label: 'All Overdue', value: 'all' },
    { label: 'PAR 1-30', value: '1-30' },
    { label: 'PAR 31-60', value: '31-60' },
    { label: 'PAR 61-90', value: '61-90' },
    { label: 'PAR 90+', value: '90+' },
  ];
  readonly activeBucket = signal('all');
  setBucket(v: string) {
    this.activeBucket.set(v);
  }

  readonly productFilter = signal('all');
  readonly officerFilter = signal('all');

  readonly productOptions: SelectOption[] = [
    { value: 'all', label: 'All products' },
    { value: 'Salary Advance', label: 'Salary Advance' },
    { value: 'Credit Wallet', label: 'Credit Wallet' },
    { value: 'Corper Wallet', label: 'Corper Wallet' },
  ];

  readonly officerOptions: SelectOption[] = [
    { value: 'all', label: 'All officers' },
    { value: 'T. Adeyemi', label: 'T. Adeyemi' },
    { value: 'B. Nwachukwu', label: 'B. Nwachukwu' },
    { value: 'K. Suleiman', label: 'K. Suleiman' },
  ];

  readonly loans = signal<OverdueLoan[]>([
    {
      loanId: 'LN-88213', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, product: 'Credit Wallet',
      overdueSinceDate: '2026-06-10', overdueSinceDays: 96, bucket: '90+', overdueAmount: 320_000, outstandingPrincipal: 210_000,
      lastPayment: '2026-05-01', lastContact: { date: '2026-06-20', method: 'Call' }, stage: 'contacted', officer: 'T. Adeyemi',
    },
    {
      loanId: 'LN-88190', customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, product: 'Salary Advance',
      overdueSinceDate: '2026-06-24', overdueSinceDays: 62, bucket: '61-90', overdueAmount: 210_000, outstandingPrincipal: 145_000,
      lastPayment: '2026-05-24', lastContact: { date: '2026-06-28', method: 'SMS' }, stage: 'promise-to-pay', officer: 'B. Nwachukwu',
      promiseAmount: 210_000, promiseDate: '2026-07-10', promiseFulfilled: false,
    },
    {
      loanId: 'LN-88104', customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, product: 'Salary Advance',
      overdueSinceDate: '2026-06-06', overdueSinceDays: 33, bucket: '31-60', overdueAmount: 95_000, outstandingPrincipal: 60_000,
      lastPayment: '2026-06-01', lastContact: { date: '2026-07-01', method: 'Email' }, stage: 'partial-payment', officer: 'T. Adeyemi',
    },
    {
      loanId: 'LN-88077', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, product: 'Corper Wallet',
      overdueSinceDate: '2026-07-04', overdueSinceDays: 9, bucket: '1-30', overdueAmount: 45_000, outstandingPrincipal: 40_000,
      lastPayment: '2026-06-25', lastContact: null, stage: 'overdue', officer: 'K. Suleiman',
    },
    {
      loanId: 'LN-88052', customer: { name: 'Ronke Balogun', email: 'ronke@princepsfinance.com' }, product: 'Credit Wallet',
      overdueSinceDate: '2026-04-01', overdueSinceDays: 120, bucket: '90+', overdueAmount: 150_000, outstandingPrincipal: 98_000,
      lastPayment: '2026-03-01', lastContact: { date: '2026-06-15', method: 'Visit' }, stage: 'written-off', officer: 'B. Nwachukwu',
    },
  ]);

  readonly filteredLoans = computed(() => {
    let list = this.loans();
    if (this.activeBucket() !== 'all') list = list.filter((l) => l.bucket === this.activeBucket());
    if (this.productFilter() !== 'all') list = list.filter((l) => l.product === this.productFilter());
    if (this.officerFilter() !== 'all') list = list.filter((l) => l.officer === this.officerFilter());
    return list;
  });

  readonly anySelected = computed(() => this.loans().some((l) => l.selected));
  readonly selectedCount = computed(() => this.loans().filter((l) => l.selected).length);

  toggleSelect(loan: OverdueLoan, checked: boolean) {
    this.loans.update((all) => all.map((l) => (l.loanId === loan.loanId ? { ...l, selected: checked } : l)));
  }

  clearSelection() {
    this.loans.update((all) => all.map((l) => ({ ...l, selected: false })));
  }

  bulkSendSms() {
    this.clearSelection();
  }

  bulkAssign() {
    this.clearSelection();
  }

  bulkEscalate() {
    this.clearSelection();
  }

  stageBadge(stage: CollectionsStage): { status: BadgeStatus; label: string } {
    switch (stage) {
      case 'overdue': return { status: 'overdue', label: 'Overdue' };
      case 'contacted': return { status: 'pending', label: 'Contacted' };
      case 'promise-to-pay': return { status: 'pending', label: 'Promise to Pay' };
      case 'partial-payment': return { status: 'pending', label: 'Partial Payment' };
      case 'resolved': return { status: 'successful', label: 'Resolved' };
      case 'written-off': return { status: 'inactive', label: 'Written Off' };
    }
  }

  bucketColor(bucket: ParBucket): string {
    if (bucket === '1-30') return 'var(--color-warning)';
    if (bucket === '31-60') return '#f97316';
    if (bucket === '61-90') return '#c2410c';
    return 'var(--color-error)';
  }

  // ── Contact log drawer ──
  readonly selected = signal<OverdueLoan | null>(null);
  readonly contactLogs = signal<Record<string, ContactLogEntry[]>>({
    'LN-88213': [
      { date: '2026-06-15', method: 'Call', outcome: 'No answer', nextAction: '2026-06-20', officer: 'T. Adeyemi' },
      { date: '2026-06-20', method: 'Call', outcome: 'Spoke — promised to pay by month end', nextAction: '2026-07-05', officer: 'T. Adeyemi' },
    ],
    'LN-88190': [
      { date: '2026-06-28', method: 'SMS', outcome: 'Promise to pay ₦210,000 by 2026-07-10', nextAction: '2026-07-10', officer: 'B. Nwachukwu' },
    ],
  });

  readonly newLogMethod = signal('Call');
  readonly newLogOutcome = signal('');
  readonly newLogNextAction = signal('');

  readonly methodOptions: SelectOption[] = [
    { value: 'Call', label: 'Call' },
    { value: 'SMS', label: 'SMS' },
    { value: 'Email', label: 'Email' },
    { value: 'Visit', label: 'Visit' },
  ];

  open(loan: OverdueLoan) {
    this.newLogMethod.set('Call');
    this.newLogOutcome.set('');
    this.newLogNextAction.set('');
    this.selected.set(loan);
  }

  close() {
    this.selected.set(null);
  }

  logsFor(loanId: string): ContactLogEntry[] {
    return this.contactLogs()[loanId] ?? [];
  }

  addContactLog(loan: OverdueLoan) {
    if (!this.newLogOutcome().trim()) return;
    this.contactLogs.update((all) => ({
      ...all,
      [loan.loanId]: [
        ...(all[loan.loanId] ?? []),
        { date: new Date().toISOString().slice(0, 10), method: this.newLogMethod(), outcome: this.newLogOutcome(), nextAction: this.newLogNextAction(), officer: 'You' },
      ],
    }));
    this.loans.update((all) => all.map((l) => (l.loanId === loan.loanId ? { ...l, stage: 'contacted', lastContact: { date: new Date().toISOString().slice(0, 10), method: this.newLogMethod() } } : l)));
    this.newLogOutcome.set('');
    this.newLogNextAction.set('');
  }

  markPromiseFulfilled(loan: OverdueLoan) {
    this.loans.update((all) => all.map((l) => (l.loanId === loan.loanId ? { ...l, promiseFulfilled: true, stage: 'resolved' } : l)));
    this.selected.set(this.loans().find((l) => l.loanId === loan.loanId) ?? null);
  }

  // ── Write-off workflow ──
  readonly writeOffOpen = signal(false);
  readonly writeOffLoan = signal<OverdueLoan | null>(null);
  readonly writeOffReason = signal('');
  readonly writeOffAmount = signal('');
  readonly writeOffAuthCode = signal('');

  readonly writeOffReasonOptions: SelectOption[] = [
    { value: 'deceased', label: 'Borrower deceased' },
    { value: 'untraceable', label: 'Borrower untraceable' },
    { value: 'bankruptcy', label: 'Bankruptcy / insolvency' },
    { value: 'uneconomical', label: 'Uneconomical to pursue' },
    { value: 'other', label: 'Other' },
  ];

  openWriteOff(loan: OverdueLoan) {
    this.writeOffLoan.set(loan);
    this.writeOffReason.set('deceased');
    this.writeOffAmount.set(loan.outstandingPrincipal.toString());
    this.writeOffAuthCode.set('');
    this.writeOffOpen.set(true);
  }

  closeWriteOff() {
    this.writeOffOpen.set(false);
  }

  confirmWriteOff() {
    const loan = this.writeOffLoan();
    if (!loan || !this.writeOffAuthCode().trim()) return;
    this.loans.update((all) => all.map((l) => (l.loanId === loan.loanId ? { ...l, stage: 'written-off' } : l)));
    this.writeOffOpen.set(false);
    this.selected.set(null);
  }

  // ── Risk settings ──
  parAlertThreshold = '15';
  autoAssignDays = '7';
  writeOffApprovalLevel: 'single' | 'dual' = 'dual';

  readonly smsTemplatesByBucket = [
    { bucket: '1–30 days', template: 'Hi {{name}}, your repayment of {{amount}} is now overdue. Please pay to avoid further action.' },
    { bucket: '31–60 days', template: '{{name}}, your loan {{loan_id}} is 31+ days overdue. Outstanding: {{outstanding}}. Please contact us.' },
    { bucket: '61–90 days', template: 'Urgent: {{name}}, loan {{loan_id}} is severely overdue ({{days}} days). Immediate payment required.' },
    { bucket: '90+ days', template: 'FINAL NOTICE: {{name}}, loan {{loan_id}} is at risk of write-off. Contact us immediately.' },
  ];
}
