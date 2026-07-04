import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SidebarComponent, ComingSoonComponent } from '../../../shared/components';

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [SidebarComponent, ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-sidebar activeItemId="risk" />
      <div class="main">
        <app-coming-soon title="Reconciliation" subtitle="Match disbursements and repayments against bank records." />
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; min-height: 100vh; background: #f7f8fa; }
    .main { flex: 1; overflow-y: auto; }
  `],
})
export class ReconciliationComponent {}
