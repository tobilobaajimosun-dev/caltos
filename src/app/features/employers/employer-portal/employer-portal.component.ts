import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComingSoonComponent } from '../../../shared/components';

@Component({
  selector: 'app-employer-portal',
  standalone: true,
  imports: [ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-coming-soon title="Employer Portal" subtitle="Manage employer relationships and payroll deduction agreements." />`,
})
export class EmployerPortalComponent {}
