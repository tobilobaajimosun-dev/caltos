import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  TableItemUser,
  StatusBadgeComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
  DrawerComponent,
  SelectComponent,
  SelectOption,
  InputComponent,
  TextareaComponent,
  ButtonComponent,
  FileUploadComponent,
  ToggleComponent,
} from '../../../shared/components';

type PaymentMethod = 'Bank Transfer' | 'Cash' | 'POS' | 'Remita' | 'IPPIS' | 'Auto-debit';
type ReminderTrigger = 'before' | 'due' | 'after';
type ReminderChannel = 'SMS' | 'Email' | 'In-App';

interface DueRow {
  loanId: string;
  customer: TableItemUser;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
}

interface ScheduleRow {
  loanId: string;
  customer: TableItemUser;
  product: string;
  officer: string;
  amount: string;
  dueDate: string;
}

interface ReminderRule {
  id: string;
  trigger: ReminderTrigger;
  days: number;
  channel: ReminderChannel;
  template: string;
  active: boolean;
}

interface ReminderLogRow {
  date: string;
  customer: string;
  loanId: string;
  channel: ReminderChannel;
  status: BadgeStatus;
  paidWithin24h: boolean;
}

interface ImportRow {
  loanId: string;
  customer: string;
  amount: string;
  matched: boolean;
  error: string | null;
}

@Component({
  selector: 'app-repayment-management',
  standalone: true,
  imports: [
    KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent,
    RoundTabsComponent, DrawerComponent, SelectComponent, InputComponent, TextareaComponent,
    ButtonComponent, FileUploadComponent, ToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repayment-management.component.html',
  styleUrl: './repayment-management.component.scss',
})
export class RepaymentManagementComponent {
  readonly tabs: Tab[] = [
    { label: 'Dashboard', value: 'dashboard' },
    { label: 'Bulk Import', value: 'import' },
    { label: 'Reminders', value: 'reminders' },
    { label: 'Schedule', value: 'schedule' },
  ];

  readonly activeTab = signal('dashboard');
  setTab(value: string) {
    this.activeTab.set(value);
  }

  readonly today = '2026-07-06';

  readonly dueToday = signal<DueRow[]>([
    { loanId: 'LN-202406-004', customer: { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' }, amountDue: 25_000, amountPaid: 0, dueDate: '2026-07-06' },
    { loanId: 'LN-202406-008', customer: { name: 'Hauwa Bello', email: 'hauwa@princepsfinance.com' }, amountDue: 40_000, amountPaid: 0, dueDate: '2026-07-06' },
    { loanId: 'LN-202406-009', customer: { name: 'Ikechukwu Eze', email: 'ikechukwu@princepsfinance.com' }, amountDue: 18_500, amountPaid: 9_000, dueDate: '2026-07-06' },
  ]);

  readonly upcoming = [
    { date: '2026-07-07', count: 5, total: 182_000 },
    { date: '2026-07-08', count: 3, total: 95_000 },
    { date: '2026-07-09', count: 7, total: 240_500 },
    { date: '2026-07-10', count: 2, total: 60_000 },
    { date: '2026-07-11', count: 4, total: 128_000 },
    { date: '2026-07-12', count: 1, total: 25_000 },
    { date: '2026-07-13', count: 6, total: 210_000 },
  ];

  readonly overdueTotal = 1_240_000;
  readonly overdueCount = 14;
  readonly collectedPct = 87;
  readonly avgDaysLate = 6.4;

  showUnpaidOnly = signal(false);
  readonly visibleDueToday = computed(() =>
    this.showUnpaidOnly() ? this.dueToday().filter((r) => r.amountPaid === 0) : this.dueToday(),
  );

  // ── Record payment ──
  readonly recording = signal<DueRow | null>(null);
  readonly paymentAmount = signal('');
  readonly paymentMethod = signal<PaymentMethod>('Bank Transfer');
  readonly paymentReference = signal('');
  readonly paymentNotes = signal('');
  readonly lastConfirmation = signal<{ loanId: string; newBalance: number; nextDue: string } | null>(null);

  readonly methodOptions: SelectOption[] = [
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cash', label: 'Cash' },
    { value: 'POS', label: 'POS' },
    { value: 'Remita', label: 'Remita' },
    { value: 'IPPIS', label: 'IPPIS' },
    { value: 'Auto-debit', label: 'Auto-debit' },
  ];

  openRecordPayment(row: DueRow) {
    this.paymentAmount.set((row.amountDue - row.amountPaid).toString());
    this.paymentMethod.set('Bank Transfer');
    this.paymentReference.set('');
    this.paymentNotes.set('');
    this.lastConfirmation.set(null);
    this.recording.set(row);
  }

  closeRecordPayment() {
    this.recording.set(null);
  }

  // ── Liquidation (early settlement) ──
  readonly liquidating = signal<DueRow | null>(null);
  readonly liquidationDone = signal(false);

  openLiquidation(row: DueRow) {
    this.liquidationDone.set(false);
    this.liquidating.set(row);
  }

  closeLiquidation() {
    this.liquidating.set(null);
    this.liquidationDone.set(false);
  }

  // Demo payoff math — real values come from the loan's productConfigSnapshot
  // liquidationPolicy (see loan-detail's Liquidation tab).
  liquidationOutstanding(row: DueRow): number {
    return row.amountDue * 6 - row.amountPaid;
  }

  liquidationInterestWaived(row: DueRow): number {
    return Math.round(row.amountDue * 6 * 0.12);
  }

  liquidationFee(row: DueRow): number {
    return Math.round(this.liquidationOutstanding(row) * 0.02);
  }

  liquidationTotal(row: DueRow): number {
    return this.liquidationOutstanding(row) - this.liquidationInterestWaived(row) + this.liquidationFee(row);
  }

  confirmLiquidation(row: DueRow) {
    this.liquidationDone.set(true);
    this.dueToday.update((rows) => rows.filter((r) => r.loanId !== row.loanId));
  }

  get paymentDelta(): number {
    const row = this.recording();
    if (!row) return 0;
    const amount = Number(this.paymentAmount()) || 0;
    return amount - (row.amountDue - row.amountPaid);
  }

  confirmPayment(row: DueRow) {
    const amount = Number(this.paymentAmount()) || 0;
    this.dueToday.update((all) => all.map((r) => (r.loanId === row.loanId ? { ...r, amountPaid: r.amountPaid + amount } : r)));
    const updated = this.dueToday().find((r) => r.loanId === row.loanId)!;
    this.lastConfirmation.set({
      loanId: row.loanId,
      newBalance: Math.max(0, updated.amountDue - updated.amountPaid),
      nextDue: '2026-08-06',
    });
  }

  recordAnother() {
    this.lastConfirmation.set(null);
    this.recording.set(null);
  }

  // ── Bulk import ──
  readonly importFile = signal<File | null>(null);
  readonly importPreview = signal<ImportRow[]>([]);

  onFileSelected(file: File | null) {
    this.importFile.set(file);
    if (!file) {
      this.importPreview.set([]);
      return;
    }
    this.importPreview.set([
      { loanId: 'LN-202406-001', customer: 'Akpan Akporigomayen', amount: '₦25,000', matched: true, error: null },
      { loanId: 'LN-202406-002', customer: 'Bola Adebayo', amount: '₦18,000', matched: true, error: null },
      { loanId: 'LN-UNKNOWN-99', customer: 'Unknown Customer', amount: '₦12,000', matched: false, error: 'No matching loan ID' },
      { loanId: 'LN-202406-004', customer: 'Damilola Ojo', amount: '', matched: false, error: 'Missing amount' },
    ]);
  }

  readonly importMatchedCount = computed(() => this.importPreview().filter((r) => r.matched).length);
  readonly importErrorCount = computed(() => this.importPreview().filter((r) => !r.matched).length);

  confirmImport() {
    this.importFile.set(null);
    this.importPreview.set([]);
  }

  // ── Reminders ──
  readonly reminderRules = signal<ReminderRule[]>([
    { id: 'r1', trigger: 'before', days: 3, channel: 'SMS', template: 'reminder', active: true },
    { id: 'r2', trigger: 'due', days: 0, channel: 'Email', template: 'due-day', active: true },
    { id: 'r3', trigger: 'after', days: 1, channel: 'SMS', template: 'overdue-day-1', active: true },
    { id: 'r4', trigger: 'after', days: 7, channel: 'SMS', template: 'overdue-day-7', active: false },
  ]);

  toggleRule(rule: ReminderRule, active: boolean) {
    this.reminderRules.update((all) => all.map((r) => (r.id === rule.id ? { ...r, active } : r)));
  }

  ruleLabel(rule: ReminderRule): string {
    if (rule.trigger === 'due') return 'On due date';
    if (rule.trigger === 'before') return `${rule.days} day${rule.days === 1 ? '' : 's'} before due`;
    return `${rule.days} day${rule.days === 1 ? '' : 's'} after due (overdue)`;
  }

  readonly reminderLog: ReminderLogRow[] = [
    { date: '2026-07-06 06:00', customer: 'Damilola Ojo', loanId: 'LN-202406-004', channel: 'SMS', status: 'successful', paidWithin24h: true },
    { date: '2026-07-06 06:00', customer: 'Hauwa Bello', loanId: 'LN-202406-008', channel: 'SMS', status: 'successful', paidWithin24h: false },
    { date: '2026-07-05 09:00', customer: 'Chika Okafor', loanId: 'LN-202406-003', channel: 'Email', status: 'failed', paidWithin24h: false },
  ];

  readonly smsTemplates = [
    { stage: 'Pre-due reminder', text: 'Hi {{customer_name}}, your payment of {{amount}} for loan {{loan_id}} is due on {{due_date}}. Reply STOP to opt out.' },
    { stage: 'Due day', text: '{{customer_name}}, your repayment of {{amount}} is due today for loan {{loan_id}}.' },
    { stage: 'Overdue day 1', text: '{{customer_name}}, your payment of {{amount}} for loan {{loan_id}} is now overdue. Outstanding: {{outstanding}}.' },
    { stage: 'Overdue day 7', text: 'Urgent: {{customer_name}}, loan {{loan_id}} is 7 days overdue. Please pay {{outstanding}} to avoid further action.' },
  ];

  charCount(text: string): number {
    return text.length;
  }

  smsCost(text: string): string {
    const segments = Math.ceil(text.length / 160);
    return `₦${(segments * 4).toFixed(0)} (${segments} segment${segments === 1 ? '' : 's'})`;
  }

  // ── Schedule ──
  readonly scheduleRange = signal<'30' | '60' | '90'>('30');
  readonly groupBy = signal<'date' | 'product' | 'officer' | 'customer'>('date');

  readonly rangeOptions: SelectOption[] = [
    { value: '30', label: 'Next 30 days' },
    { value: '60', label: 'Next 60 days' },
    { value: '90', label: 'Next 90 days' },
  ];

  readonly groupOptions: SelectOption[] = [
    { value: 'date', label: 'Due Date' },
    { value: 'product', label: 'Product' },
    { value: 'officer', label: 'Officer' },
    { value: 'customer', label: 'Customer' },
  ];

  readonly scheduleRows: ScheduleRow[] = [
    { loanId: 'LN-202406-001', customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, product: 'Salary Advance', officer: 'T. Adeyemi', amount: '₦25,000', dueDate: '2026-07-30' },
    { loanId: 'LN-202406-002', customer: { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' }, product: 'Corper Wallet', officer: 'B. Nwachukwu', amount: '₦18,000', dueDate: '2026-07-15' },
    { loanId: 'LN-202406-004', customer: { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' }, product: 'Credit Lite', officer: 'T. Adeyemi', amount: '₦25,000', dueDate: '2026-07-06' },
    { loanId: 'LN-202406-005', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, product: 'Salary Advance', officer: 'K. Suleiman', amount: '₦35,000', dueDate: '2026-07-10' },
  ];

  readonly groupedSchedule = computed(() => {
    const key = this.groupOptions.find((g) => g.value === this.groupBy())!.label;
    const groups = new Map<string, ScheduleRow[]>();
    for (const row of this.scheduleRows) {
      const groupKey = this.groupBy() === 'date' ? row.dueDate
        : this.groupBy() === 'product' ? row.product
        : this.groupBy() === 'officer' ? row.officer
        : row.customer.name;
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(row);
    }
    return { label: key, entries: Array.from(groups.entries()) };
  });

  exportSchedule() {
    const header = 'Loan ID,Customer,Product,Officer,Amount,Due Date\n';
    const body = this.scheduleRows.map((r) => `${r.loanId},${r.customer.name},${r.product},${r.officer},${r.amount},${r.dueDate}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repayment-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
