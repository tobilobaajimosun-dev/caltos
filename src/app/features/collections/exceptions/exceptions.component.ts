import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComingSoonComponent } from '../../../shared/components';

@Component({
  selector: 'app-exceptions',
  standalone: true,
  imports: [ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-coming-soon title="Exception Management" subtitle="Review and resolve flagged collections exceptions." />`,
})
export class ExceptionsComponent {}
