import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComingSoonComponent } from '../../../shared/components';

@Component({
  selector: 'app-recovery-portal',
  standalone: true,
  imports: [ComingSoonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-coming-soon title="Recovery Officer Portal" subtitle="Assign and track recovery officer casework." />`,
})
export class RecoveryPortalComponent {}
