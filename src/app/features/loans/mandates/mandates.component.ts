import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  ButtonComponent,
} from '../../../shared/components';

type Channel = 'IPPIS' | 'Remita' | 'Dedukt' | 'WACS';
type MandateStatus = 'active' | 'pending' | 'cancelled' | 'failed' | 'inflight';

interface MandateRow {
  mandateId: string;
  channel: Channel;
  status: MandateStatus;
  lastAction: string;
}

interface LifecycleEvent {
  at: string;
  event: string;
}

@Component({
  selector: 'app-mandates',
  standalone: true,
  imports: [RouterLink, KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mandates.component.html',
  styleUrl: './mandates.component.scss',
})
export class MandatesComponent {
  private readonly route = inject(ActivatedRoute);
  readonly loanId = this.route.snapshot.paramMap.get('id') ?? 'LN-88213';

  readonly loanStatus = signal<'active' | 'liquidated' | 'fully-repaid' | 'cancelled'>('active');

  readonly mandates = signal<MandateRow[]>([
    { mandateId: 'RM-30291', channel: 'Remita', status: 'active', lastAction: '2026-06-01' },
    { mandateId: 'IP-11842', channel: 'IPPIS', status: 'active', lastAction: '2026-06-01' },
    { mandateId: 'WA-58120', channel: 'WACS', status: 'active', lastAction: '2026-06-01' },
    { mandateId: 'DK-90211', channel: 'Dedukt', status: 'inflight', lastAction: '2026-07-04' },
  ]);

  readonly events = signal<LifecycleEvent[]>([
    { at: '2026-06-01 09:00', event: 'Loan disbursed — Remita and IPPIS mandates activated' },
    { at: '2026-07-04 08:20', event: 'Dedukt mandate incomplete at disbursement — marked inflight, processing async' },
  ]);

  readonly activeCount = computed(() => this.mandates().filter((m) => m.status === 'active').length);
  readonly inflightCount = computed(() => this.mandates().filter((m) => m.status === 'inflight').length);
  readonly cancelledCount = computed(() => this.mandates().filter((m) => m.status === 'cancelled').length);

  statusBadge(status: MandateStatus): { status: BadgeStatus; label: string } {
    switch (status) {
      case 'active': return { status: 'active', label: 'Active' };
      case 'pending': return { status: 'pending', label: 'Pending' };
      case 'cancelled': return { status: 'inactive', label: 'Cancelled' };
      case 'failed': return { status: 'failed', label: 'Failed' };
      case 'inflight': return { status: 'overdue', label: 'Inflight' };
    }
  }

  private log(event: string) {
    this.events.update((all) => [...all, { at: 'Just now', event }]);
  }

  liquidateLoan() {
    if (this.loanStatus() !== 'active') return;
    this.loanStatus.set('liquidated');
    this.mandates.update((all) => all.map((m) =>
      m.channel === 'Remita' ? { ...m, status: 'cancelled', lastAction: 'Just now' } : m,
    ));
    this.log('Loan marked liquidated — Remita mandate auto-cancelled, no manual intervention required');
  }

  markFullyRepaid() {
    if (this.loanStatus() === 'fully-repaid') return;
    this.loanStatus.set('fully-repaid');
    this.mandates.update((all) => all.map((m) =>
      m.channel === 'WACS' ? { ...m, status: 'cancelled', lastAction: 'Just now' } : m,
    ));
    this.log('Loan moved to WACS "fully paid" bucket — deduction stoppage triggered automatically');
  }

  sendIppisStoppageFlag() {
    this.mandates.update((all) => all.map((m) =>
      m.channel === 'IPPIS' ? { ...m, status: 'cancelled', lastAction: 'Just now' } : m,
    ));
    this.log('IPPIS stoppage flag sent to administrator — loan fully settled');
  }

  completeInflight(row: MandateRow) {
    this.mandates.update((all) => all.map((m) =>
      m.mandateId === row.mandateId ? { ...m, status: 'active', lastAction: 'Just now' } : m,
    ));
    this.log(`${row.channel} mandate ${row.mandateId} completed setup — moved from inflight to active`);
  }
}
