import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComingSoonComponent } from '../../../shared/components';

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-coming-soon title="Reconciliation" subtitle="Match disbursements and repayments against bank records." />`,
})
export class ReconciliationComponent {}
