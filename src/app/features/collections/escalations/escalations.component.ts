import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
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
  ToggleComponent,
  ButtonComponent,
} from '../../../shared/components';

type ResolutionOutcome = 'paid' | 'promise-to-pay' | 'write-off' | 'restructure';

interface ActivityEntry {
  at: string;
  outcome: string;
  nextAction: string | null;
}

interface EscalationRow {
  id: string;
  customer: { name: string; email: string };
  daysOverdue: number;
  stage: 'Day 1' | 'Day 30' | 'Day 60' | 'Day 90+';
  amount: string;
  assignedTo: string;
  status: BadgeStatus;
  resolution: ResolutionOutcome | null;
  activity: ActivityEntry[];
}

interface TriggerRule {
  threshold: 'Day 1' | 'Day 30' | 'Day 60' | 'Day 90+';
  action: string;
  enabled: boolean;
}

interface OfficerPerformance {
  officer: string;
  accounts: number;
  resolutionRate: number;
  avgDaysToResolution: number;
}

@Component({
  selector: 'app-escalations',
  standalone: true,
  imports: [
    KpiCardComponent,
    ColumnTitleComponent,
    TableItemComponent,
    StatusBadgeComponent,
    RoundTabsComponent,
    DrawerComponent,
    SelectComponent,
    ToggleComponent,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './escalations.component.html',
  styleUrl: './escalations.component.scss',
})
export class EscalationsComponent {
  readonly tabs: Tab[] = [
    { label: 'Escalated Accounts', value: 'accounts' },
    { label: 'Trigger Rules', value: 'rules' },
    { label: 'Officer Performance', value: 'performance' },
  ];

  readonly activeTab = signal('accounts');
  setTab(value: string) {
    this.activeTab.set(value);
  }

  readonly officers: SelectOption[] = [
    { value: 'Recovery Team A', label: 'Recovery Team A' },
    { value: 'Recovery Team B', label: 'Recovery Team B' },
    { value: 'T. Adeyemi', label: 'T. Adeyemi' },
    { value: 'B. Nwachukwu', label: 'B. Nwachukwu' },
  ];

  readonly roundRobin = signal(true);

  readonly rows = signal<EscalationRow[]>([
    {
      id: 'ESC-201', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' },
      daysOverdue: 96, stage: 'Day 90+', amount: '₦320,000', assignedTo: 'Recovery Team A', status: 'overdue', resolution: null,
      activity: [
        { at: '2026-06-10', outcome: 'No answer', nextAction: '2026-06-17' },
        { at: '2026-06-20', outcome: 'Legal notice sent', nextAction: '2026-07-05' },
      ],
    },
    {
      id: 'ESC-202', customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' },
      daysOverdue: 62, stage: 'Day 60', amount: '₦210,000', assignedTo: 'Recovery Team B', status: 'pending', resolution: null,
      activity: [{ at: '2026-06-28', outcome: 'Field visit scheduled', nextAction: '2026-07-10' }],
    },
    {
      id: 'ESC-203', customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' },
      daysOverdue: 33, stage: 'Day 30', amount: '₦95,000', assignedTo: 'Recovery Team A', status: 'pending', resolution: null,
      activity: [{ at: '2026-07-01', outcome: 'Final reminder sent', nextAction: '2026-07-08' }],
    },
    {
      id: 'ESC-204', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' },
      daysOverdue: 3, stage: 'Day 1', amount: '₦45,000', assignedTo: 'T. Adeyemi', status: 'pending', resolution: null,
      activity: [{ at: '2026-07-04', outcome: 'First reminder sent', nextAction: '2026-07-06' }],
    },
  ]);

  readonly activeCount = computed(() => this.rows().filter((r) => !r.resolution).length);
  readonly legalStageCount = computed(() => this.rows().filter((r) => r.stage === 'Day 90+' && !r.resolution).length);
  readonly resolvedCount = computed(() => this.rows().filter((r) => !!r.resolution).length);

  readonly triggerRules = signal<TriggerRule[]>([
    { threshold: 'Day 1', action: 'Automated SMS/email reminder', enabled: true },
    { threshold: 'Day 30', action: 'Assign to recovery officer, phone contact', enabled: true },
    { threshold: 'Day 60', action: 'Field visit scheduled, final reminder', enabled: true },
    { threshold: 'Day 90+', action: 'Legal notice, escalate to legal team', enabled: true },
  ]);

  toggleRule(rule: TriggerRule, enabled: boolean) {
    this.triggerRules.update((all) => all.map((r) => (r.threshold === rule.threshold ? { ...r, enabled } : r)));
  }

  readonly officerPerformance: OfficerPerformance[] = [
    { officer: 'Recovery Team A', accounts: 38, resolutionRate: 71, avgDaysToResolution: 12 },
    { officer: 'Recovery Team B', accounts: 29, resolutionRate: 64, avgDaysToResolution: 15 },
    { officer: 'T. Adeyemi', accounts: 22, resolutionRate: 82, avgDaysToResolution: 8 },
    { officer: 'B. Nwachukwu', accounts: 19, resolutionRate: 77, avgDaysToResolution: 10 },
  ];

  readonly selected = signal<EscalationRow | null>(null);

  open(row: EscalationRow) {
    this.selected.set(row);
  }

  closeDrawer() {
    this.selected.set(null);
  }

  assign(row: EscalationRow, who: string) {
    this.rows.update((all) => all.map((r) => (r.id === row.id ? { ...r, assignedTo: who } : r)));
    this.selected.set(this.rows().find((r) => r.id === row.id) ?? null);
  }

  logContact(row: EscalationRow, outcome: string) {
    const nextAction = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    this.rows.update((all) => all.map((r) => (r.id === row.id ? { ...r, activity: [...r.activity, { at: 'Just now', outcome, nextAction }] } : r)));
    this.selected.set(this.rows().find((r) => r.id === row.id) ?? null);
  }

  resolve(row: EscalationRow, outcome: ResolutionOutcome) {
    this.rows.update((all) => all.map((r) => (r.id === row.id ? { ...r, resolution: outcome, status: 'successful' as BadgeStatus } : r)));
    this.selected.set(this.rows().find((r) => r.id === row.id) ?? null);
  }

  resolutionLabel(outcome: ResolutionOutcome | null): string {
    switch (outcome) {
      case 'paid': return 'Payment received';
      case 'promise-to-pay': return 'Promise to pay';
      case 'write-off': return 'Written off';
      case 'restructure': return 'Restructured';
      default: return '';
    }
  }
}
