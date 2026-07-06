import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuickActionsService } from '../../shared/services/quick-actions.service';

@Component({
  selector: 'app-quick-actions',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss'],
})
export class QuickActionsComponent {
  private readonly router = inject(Router);
  private readonly quickActionsService = inject(QuickActionsService);

  readonly groupedActions = this.quickActionsService.groupedActions;

  goTo(actionId: string, route: string) {
    this.quickActionsService.recordRecent(actionId);
    this.router.navigateByUrl(route);
  }
}
