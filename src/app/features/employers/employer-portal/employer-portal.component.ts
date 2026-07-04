import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SidebarComponent, ComingSoonComponent } from '../../../shared/components';

@Component({
  selector: 'app-employer-portal',
  standalone: true,
  imports: [SidebarComponent, ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-sidebar activeItemId="employers" />
      <div class="main">
        <app-coming-soon title="Employer Portal" subtitle="Manage employer relationships and payroll deduction agreements." />
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; min-height: 100vh; background: #f7f8fa; }
    .main { flex: 1; overflow-y: auto; }
  `],
})
export class EmployerPortalComponent {}
