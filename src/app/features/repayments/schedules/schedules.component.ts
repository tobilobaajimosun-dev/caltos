import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  TableItemUser,
} from '../../../shared/components';

type Channel = 'IPPIS' | 'Remita' | 'Dedukt' | 'WACS' | 'Direct Debit';

interface DueRow {
  loanId: string;
  customer: TableItemUser;
  product: string;
  amountDue: number;
  dueDate: string;
  channel: Channel;
}

interface Bucket {
  key: 'today' | 'this-week' | 'later';
  label: string;
  rows: DueRow[];
}

@Component({
  selector: 'app-schedules',
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedules.component.html',
  styleUrl: './schedules.component.scss',
})
export class SchedulesComponent {
  readonly today = '2026-07-06';

  readonly dueRows: DueRow[] = [
    { loanId: 'LN-202406-004', customer: { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' }, product: 'Credit Lite', amountDue: 25_000, dueDate: '2026-07-06', channel: 'IPPIS' },
    { loanId: 'LN-202406-008', customer: { name: 'Hauwa Bello', email: 'hauwa@princepsfinance.com' }, product: 'Corper Wallet', amountDue: 40_000, dueDate: '2026-07-06', channel: 'Remita' },
    { loanId: 'LN-202406-009', customer: { name: 'Ikechukwu Eze', email: 'ikechukwu@princepsfinance.com' }, product: 'Credit Wallet', amountDue: 18_500, dueDate: '2026-07-06', channel: 'Direct Debit' },
    { loanId: 'LN-202406-001', customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, product: 'Salary Advance', amountDue: 25_000, dueDate: '2026-07-08', channel: 'IPPIS' },
    { loanId: 'LN-202406-002', customer: { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' }, product: 'Corper Wallet', amountDue: 18_000, dueDate: '2026-07-09', channel: 'Remita' },
    { loanId: 'LN-202406-005', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, product: 'Salary Advance', amountDue: 35_000, dueDate: '2026-07-11', channel: 'WACS' },
    { loanId: 'LN-202406-011', customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, product: 'Credit Alert', amountDue: 60_000, dueDate: '2026-07-20', channel: 'Dedukt' },
    { loanId: 'LN-202406-012', customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, product: 'Corper Wallet', amountDue: 22_000, dueDate: '2026-07-25', channel: 'Direct Debit' },
  ];

  private startOfWeek(dateStr: string): Date {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  readonly buckets = computed<Bucket[]>(() => {
    const todayDate = new Date(this.today);
    const weekStart = this.startOfWeek(this.today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const today: DueRow[] = [];
    const thisWeek: DueRow[] = [];
    const later: DueRow[] = [];

    for (const row of this.dueRows) {
      const due = new Date(row.dueDate);
      if (row.dueDate === this.today) {
        today.push(row);
      } else if (due >= todayDate && due <= weekEnd) {
        thisWeek.push(row);
      } else {
        later.push(row);
      }
    }

    return [
      { key: 'today', label: 'Due today', rows: today },
      { key: 'this-week', label: 'Due this week', rows: thisWeek },
      { key: 'later', label: 'Due later', rows: later },
    ];
  });

  readonly dueTodayCount = computed(() => this.buckets().find((b) => b.key === 'today')?.rows.length ?? 0);
  readonly dueThisWeekCount = computed(() =>
    (this.buckets().find((b) => b.key === 'today')?.rows.length ?? 0) +
    (this.buckets().find((b) => b.key === 'this-week')?.rows.length ?? 0),
  );
  readonly totalAmountDue = computed(() => this.dueRows.reduce((sum, r) => sum + r.amountDue, 0));
}
