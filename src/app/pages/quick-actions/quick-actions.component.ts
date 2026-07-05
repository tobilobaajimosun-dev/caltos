import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss'],
})
export class QuickActionsComponent {
  kycComplete = false;

  readonly orgName = 'Princeps Finance';
  readonly orgInitial = 'P';
  readonly orgAvatarColor = '#E55A2B';
  readonly userName = 'Jesulademi Ajimosun';

  completeKyc() {
    this.kycComplete = true;
  }
}
