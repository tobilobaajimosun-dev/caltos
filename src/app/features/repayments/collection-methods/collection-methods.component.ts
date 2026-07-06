import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { StatusBadgeComponent, ToggleComponent, BadgeStatus } from '../../../shared/components';

type Channel = 'IPPIS' | 'Remita' | 'Dedukt' | 'WACS' | 'Direct Debit';

interface CollectionMethod {
  channel: Channel;
  description: string;
  tags: string[];
  status: BadgeStatus;
  statusLabel: string;
  enabled: boolean;
}

@Component({
  selector: 'app-collection-methods',
  imports: [StatusBadgeComponent, ToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collection-methods.component.html',
  styleUrl: './collection-methods.component.scss',
})
export class CollectionMethodsComponent {
  // Copy reused from create-loan.component.ts's deduction-channel step for consistency.
  readonly methods = signal<CollectionMethod[]>([
    {
      channel: 'IPPIS',
      description: 'At-source payroll deduction for federal employees. Safest option — deducted before salary is credited.',
      tags: ['Federal + some states'],
      status: 'active',
      statusLabel: 'Connected',
      enabled: true,
    },
    {
      channel: 'Remita',
      description: "Standing order / mandate on salary inflow. Works for federal and some state employees paid via Remita.",
      tags: ['Requires Remita key'],
      status: 'active',
      statusLabel: 'Connected',
      enabled: true,
    },
    {
      channel: 'Dedukt',
      description: 'Third-party deduction platform for organizations not on IPPIS or Remita.',
      tags: [],
      status: 'pending',
      statusLabel: 'Not connected',
      enabled: false,
    },
    {
      channel: 'WACS',
      description: 'State-level payroll deduction for participating state government employees.',
      tags: [],
      status: 'pending',
      statusLabel: 'Not connected',
      enabled: false,
    },
    {
      channel: 'Direct Debit',
      description: "Standard direct debit from borrower's account — the fallback option when no payroll integration applies.",
      tags: [],
      status: 'active',
      statusLabel: 'Connected',
      enabled: true,
    },
  ]);

  toggleMethod(method: CollectionMethod, enabled: boolean) {
    this.methods.update((all) =>
      all.map((m) =>
        m.channel === method.channel
          ? { ...m, enabled, status: enabled ? 'active' : 'pending', statusLabel: enabled ? 'Connected' : 'Not connected' }
          : m,
      ),
    );
  }

  readonly connectedCount = computed(() => this.methods().filter((m) => m.enabled).length);
  readonly totalCount = computed(() => this.methods().length);
}
