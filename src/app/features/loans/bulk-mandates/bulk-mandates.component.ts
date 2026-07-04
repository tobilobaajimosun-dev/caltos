import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComingSoonComponent } from '../../../shared/components';

@Component({
  selector: 'app-bulk-mandates',
  standalone: true,
  imports: [ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-coming-soon title="Bulk Mandate Operations" subtitle="Upload and process mandates in bulk across loans." />`,
})
export class BulkMandatesComponent {}
