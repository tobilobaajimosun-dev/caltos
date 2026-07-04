import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [RouterLink],
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
