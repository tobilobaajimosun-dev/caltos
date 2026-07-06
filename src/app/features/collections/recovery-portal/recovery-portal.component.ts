import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  KpiCardComponent,
  AvatarComponent,
  ProgressBarComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
  SelectComponent,
  SelectOption,
  DrawerComponent,
  TextareaComponent,
  ButtonComponent,
} from '../../../shared/components';

type ContactOutcome = 'Spoke' | 'No answer' | 'Promised to pay' | 'Refused' | 'Wrong number';

interface AssignedAccount {
  id: string;
  customer: { name: string; email: string };
  daysOverdue: number;
  amount: string;
  lastContact: string | null;
  callbackDue: string | null;
  promiseDate: string | null;
  attempts: number;
  disputed: boolean;
}

interface OfficerRow {
  name: string;
  casesAssigned: number;
  recoveredPct: number;
  recoveredAmount: string;
  contactsToday: number;
  promisesLogged: number;
  resolutionsClosed: number;
}

@Component({
  selector: 'app-recovery-portal',
  standalone: true,
  imports: [
    KpiCardComponent,
    AvatarComponent,
    ProgressBarComponent,
    ColumnTitleComponent,
    TableItemComponent,
    StatusBadgeComponent,
    RoundTabsComponent,
    SelectComponent,
    DrawerComponent,
    TextareaComponent,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recovery-portal.component.html',
  styleUrl: './recovery-portal.component.scss',
})
export class RecoveryPortalComponent {
  readonly tabs: Tab[] = [
    { label: 'My Day', value: 'myday' },
    { label: 'Promise-to-Pay', value: 'ptp' },
    { label: 'Escalation Queue', value: 'escalation' },
    { label: 'Team Overview', value: 'team' },
  ];

  readonly activeTab = signal('myday');
  setTab(value: string) {
    this.activeTab.set(value);
  }

  readonly outcomeOptions: SelectOption[] = [
    { value: 'Spoke', label: 'Spoke' },
    { value: 'No answer', label: 'No answer' },
    { value: 'Promised to pay', label: 'Promised to pay' },
    { value: 'Refused', label: 'Refused' },
    { value: 'Wrong number', label: 'Wrong number' },
  ];

  readonly myAccounts = signal<AssignedAccount[]>([
    { id: 'LN-88213', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, daysOverdue: 96, amount: '₦320,000', lastContact: '2026-06-20', callbackDue: '2026-07-05', promiseDate: null, attempts: 4, disputed: false },
    { id: 'LN-88190', customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, daysOverdue: 62, amount: '₦210,000', lastContact: '2026-06-28', callbackDue: '2026-07-05', promiseDate: null, attempts: 2, disputed: false },
    { id: 'LN-88104', customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, daysOverdue: 33, amount: '₦95,000', lastContact: '2026-06-25', callbackDue: '2026-07-08', promiseDate: '2026-07-10', attempts: 3, disputed: false },
    { id: 'LN-88077', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, daysOverdue: 9, amount: '₦45,000', lastContact: null, callbackDue: '2026-07-05', promiseDate: null, attempts: 0, disputed: false },
    { id: 'LN-88052', customer: { name: 'Ronke Balogun', email: 'ronke@princepsfinance.com' }, daysOverdue: 120, amount: '₦150,000', lastContact: '2026-06-15', callbackDue: '2026-07-09', promiseDate: '2026-06-30', attempts: 6, disputed: true },
  ]);

  readonly today = '2026-07-05';

  readonly sortedByPriority = computed(() =>
    [...this.myAccounts()].sort((a, b) => b.daysOverdue - a.daysOverdue));

  readonly todaysCallList = computed(() =>
    this.myAccounts().filter((a) => a.callbackDue === this.today));

  readonly promiseAccounts = computed(() =>
    this.myAccounts().filter((a) => a.promiseDate));

  readonly escalationQueue = computed(() =>
    this.myAccounts().filter((a) => a.attempts >= 5 || a.disputed || (a.promiseDate && a.promiseDate < this.today)));

  readonly contactsToday = signal(3);
  readonly promisesLoggedToday = signal(1);
  readonly resolutionsClosedToday = signal(0);

  daysUntilPromise(promiseDate: string): number {
    return Math.round((new Date(promiseDate).getTime() - new Date(this.today).getTime()) / 86_400_000);
  }

  isBrokenPromise(promiseDate: string): boolean {
    return promiseDate < this.today;
  }

  readonly logging = signal<AssignedAccount | null>(null);
  readonly outcome = signal<ContactOutcome>('Spoke');
  readonly notes = signal('');
  readonly nextActionDate = signal('');

  openQuickLog(account: AssignedAccount) {
    this.outcome.set('Spoke');
    this.notes.set('');
    this.nextActionDate.set('');
    this.logging.set(account);
  }

  closeQuickLog() {
    this.logging.set(null);
  }

  submitQuickLog(account: AssignedAccount) {
    const outcome = this.outcome();
    const nextAction = this.nextActionDate() || null;
    this.myAccounts.update((all) => all.map((a) => (a.id === account.id ? {
      ...a,
      lastContact: this.today,
      callbackDue: nextAction,
      attempts: a.attempts + 1,
      promiseDate: outcome === 'Promised to pay' ? (nextAction ?? a.promiseDate) : a.promiseDate,
    } : a)));
    this.contactsToday.update((n) => n + 1);
    if (outcome === 'Promised to pay') this.promisesLoggedToday.update((n) => n + 1);
    this.logging.set(null);
  }

  readonly officers: OfficerRow[] = [
    { name: 'Tunde Bakare', casesAssigned: 18, recoveredPct: 72, recoveredAmount: '₦890,000', contactsToday: 9, promisesLogged: 3, resolutionsClosed: 2 },
    { name: 'Ngozi Eze', casesAssigned: 14, recoveredPct: 58, recoveredAmount: '₦610,000', contactsToday: 6, promisesLogged: 2, resolutionsClosed: 1 },
    { name: 'Yusuf Ibrahim', casesAssigned: 21, recoveredPct: 45, recoveredAmount: '₦540,000', contactsToday: 11, promisesLogged: 4, resolutionsClosed: 1 },
  ];

  statusBadge(account: AssignedAccount): { status: BadgeStatus; label: string } {
    if (account.disputed) return { status: 'failed', label: 'Disputed' };
    if (account.attempts >= 5) return { status: 'overdue', label: 'Needs review' };
    return { status: 'pending', label: 'In progress' };
  }
}
