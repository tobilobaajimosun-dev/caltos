import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
  DrawerComponent,
  SelectComponent,
  SelectOption,
  TextareaComponent,
  ButtonComponent,
} from '../../../shared/components';

type ExceptionCategory = 'Failed deduction' | 'Variance' | 'Mandate error' | 'Over-deduction' | 'Posting failure' | 'Duplicate';
type ExceptionState = 'open' | 'investigating' | 'resolved' | 'escalated' | 'closed';
type Channel = 'IPPIS' | 'Remita' | 'Dedukt' | 'WACS' | 'Direct Debit';

interface AuditEntry {
  at: string;
  who: string;
  action: string;
}

interface ExceptionRow {
  id: string;
  customer: { name: string; email: string };
  category: ExceptionCategory;
  channel: Channel;
  reason: string;
  amount: string;
  flaggedOn: string;
  state: ExceptionState;
  assignee: string;
  resolutionNote?: string;
  audit: AuditEntry[];
}

interface LeakageRow {
  channel: Channel;
  unresolvedCount: number;
  unresolvedValue: number;
  trend: 'up' | 'down' | 'flat';
}

@Component({
  selector: 'app-exceptions',
  standalone: true,
  imports: [
    DecimalPipe,
    KpiCardComponent,
    ColumnTitleComponent,
    TableItemComponent,
    StatusBadgeComponent,
    RoundTabsComponent,
    DrawerComponent,
    SelectComponent,
    TextareaComponent,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exceptions.component.html',
  styleUrl: './exceptions.component.scss',
})
export class ExceptionsComponent {
  readonly categoryTabs: Tab[] = [
    { label: 'All', value: 'all' },
    { label: 'Failed deduction', value: 'Failed deduction' },
    { label: 'Variance', value: 'Variance' },
    { label: 'Mandate error', value: 'Mandate error' },
    { label: 'Over-deduction', value: 'Over-deduction' },
    { label: 'Posting failure', value: 'Posting failure' },
    { label: 'Duplicate', value: 'Duplicate' },
  ];

  readonly activeCategory = signal('all');

  setCategory(value: string) {
    this.activeCategory.set(value);
  }

  readonly assignees: SelectOption[] = [
    { value: '', label: 'Unassigned' },
    { value: 'T. Adeyemi', label: 'T. Adeyemi' },
    { value: 'B. Nwachukwu', label: 'B. Nwachukwu' },
    { value: 'K. Suleiman', label: 'K. Suleiman' },
  ];

  readonly rows = signal<ExceptionRow[]>([
    {
      id: 'EXC-4021', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' },
      category: 'Duplicate', channel: 'Remita', reason: 'Duplicate repayment posted twice', amount: '₦25,000',
      flaggedOn: '2026-07-02', state: 'open', assignee: '',
      audit: [{ at: '2026-07-02 09:14', who: 'System', action: 'Flagged — duplicate posting detected' }],
    },
    {
      id: 'EXC-4022', customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' },
      category: 'Variance', channel: 'Dedukt', reason: 'Amount mismatch vs. schedule', amount: '₦12,500',
      flaggedOn: '2026-07-01', state: 'investigating', assignee: 'T. Adeyemi',
      audit: [
        { at: '2026-07-01 08:02', who: 'System', action: 'Flagged — variance breach' },
        { at: '2026-07-01 10:30', who: 'T. Adeyemi', action: 'Assigned to self, investigating' },
      ],
    },
    {
      id: 'EXC-4023', customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' },
      category: 'Over-deduction', channel: 'IPPIS', reason: 'Collected exceeds expected by ₦8,000', amount: '₦40,000',
      flaggedOn: '2026-06-29', state: 'resolved', assignee: 'B. Nwachukwu',
      resolutionNote: 'Refund initiated via Refunds module, ref RF-1183.',
      audit: [
        { at: '2026-06-29 07:40', who: 'System', action: 'Flagged — over-deduction' },
        { at: '2026-06-29 09:00', who: 'B. Nwachukwu', action: 'Assigned' },
        { at: '2026-06-29 14:12', who: 'B. Nwachukwu', action: 'Resolved — refund initiated' },
      ],
    },
    {
      id: 'EXC-4024', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' },
      category: 'Mandate error', channel: 'WACS', reason: 'Mandate reference not linked to loan', amount: '₦45,000',
      flaggedOn: '2026-07-03', state: 'open', assignee: '',
      audit: [{ at: '2026-07-03 06:20', who: 'System', action: 'Flagged — mandate error' }],
    },
    {
      id: 'EXC-4025', customer: { name: 'Ronke Balogun', email: 'ronke@princepsfinance.com' },
      category: 'Posting failure', channel: 'Direct Debit', reason: 'Deduction succeeded but posting to ledger failed', amount: '₦150,000',
      flaggedOn: '2026-07-04', state: 'escalated', assignee: 'K. Suleiman',
      audit: [
        { at: '2026-07-04 05:55', who: 'System', action: 'Flagged — posting failure' },
        { at: '2026-07-04 09:10', who: 'K. Suleiman', action: 'Escalated to engineering' },
      ],
    },
  ]);

  readonly filteredRows = computed(() => {
    const cat = this.activeCategory();
    return cat === 'all' ? this.rows() : this.rows().filter((r) => r.category === cat);
  });

  readonly openCount = computed(() => this.rows().filter((r) => r.state === 'open' || r.state === 'investigating').length);
  readonly resolvedTodayCount = computed(() => this.rows().filter((r) => r.state === 'resolved' || r.state === 'closed').length);
  readonly totalLeakage = computed(() => this.leakageByChannel.reduce((sum, r) => sum + r.unresolvedValue, 0));

  readonly leakageByChannel: LeakageRow[] = [
    { channel: 'IPPIS', unresolvedCount: 4, unresolvedValue: 380_000, trend: 'down' },
    { channel: 'Remita', unresolvedCount: 9, unresolvedValue: 620_000, trend: 'up' },
    { channel: 'Dedukt', unresolvedCount: 6, unresolvedValue: 415_000, trend: 'up' },
    { channel: 'WACS', unresolvedCount: 2, unresolvedValue: 95_000, trend: 'flat' },
    { channel: 'Direct Debit', unresolvedCount: 3, unresolvedValue: 210_000, trend: 'down' },
  ];

  readonly selected = signal<ExceptionRow | null>(null);
  readonly noteDraft = signal('');

  stateBadge(state: ExceptionState): { status: BadgeStatus; label: string } {
    switch (state) {
      case 'open': return { status: 'pending', label: 'Open' };
      case 'investigating': return { status: 'overdue', label: 'Investigating' };
      case 'resolved': return { status: 'successful', label: 'Resolved' };
      case 'escalated': return { status: 'failed', label: 'Escalated' };
      case 'closed': return { status: 'inactive', label: 'Closed' };
    }
  }

  open(row: ExceptionRow) {
    this.noteDraft.set('');
    this.selected.set(row);
  }

  closeDrawer() {
    this.selected.set(null);
  }

  assign(row: ExceptionRow, who: string) {
    this.rows.update((all) => all.map((r) => (r.id === row.id ? {
      ...r,
      assignee: who,
      state: r.state === 'open' ? 'investigating' : r.state,
      audit: [...r.audit, { at: 'Just now', who: who || 'Unassigned', action: who ? `Assigned to ${who}` : 'Unassigned' }],
    } : r)));
    const updated = this.rows().find((r) => r.id === row.id) ?? null;
    this.selected.set(updated);
  }

  resolveOrEscalate(row: ExceptionRow, outcome: 'resolved' | 'escalated') {
    const note = this.noteDraft().trim();
    this.rows.update((all) => all.map((r) => (r.id === row.id ? {
      ...r,
      state: outcome,
      resolutionNote: note || r.resolutionNote,
      audit: [...r.audit, { at: 'Just now', who: r.assignee || 'Unassigned', action: `${outcome === 'resolved' ? 'Resolved' : 'Escalated'}${note ? ' — ' + note : ''}` }],
    } : r)));
    const updated = this.rows().find((r) => r.id === row.id) ?? null;
    this.selected.set(updated);
  }

  close(row: ExceptionRow) {
    this.rows.update((all) => all.map((r) => (r.id === row.id ? {
      ...r,
      state: 'closed',
      audit: [...r.audit, { at: 'Just now', who: r.assignee || 'Unassigned', action: 'Closed' }],
    } : r)));
    const updated = this.rows().find((r) => r.id === row.id) ?? null;
    this.selected.set(updated);
  }
}
