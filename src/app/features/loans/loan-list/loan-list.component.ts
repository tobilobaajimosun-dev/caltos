import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SidebarComponent, ComingSoonComponent } from '../../../shared/components';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [SidebarComponent, ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-sidebar activeItemId="loans" />
      <div class="main">
        <app-coming-soon title="Loans" subtitle="List, filter, and manage loan applications." />
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; min-height: 100vh; background: #f7f8fa; }
    .main { flex: 1; overflow-y: auto; }
  `],
})
export class LoanListComponent {}
