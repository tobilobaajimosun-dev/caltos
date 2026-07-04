import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComingSoonComponent } from '../../shared/components';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-coming-soon title="Reports & Exports" subtitle="Generate and export performance and portfolio reports." />`,
})
export class ReportsComponent {}
