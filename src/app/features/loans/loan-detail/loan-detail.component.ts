import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SidebarComponent, ComingSoonComponent } from '../../../shared/components';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [SidebarComponent, ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-sidebar activeItemId="loans" />
      <div class="main">
        <app-coming-soon title="Loan Detail" subtitle="View status, repayment schedule, and history for this loan." />
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; min-height: 100vh; background: #f7f8fa; }
    .main { flex: 1; overflow-y: auto; }
  `],
})
export class LoanDetailComponent {}
