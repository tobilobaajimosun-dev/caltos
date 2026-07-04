import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type AlertBannerType = 'success' | 'warning' | 'error' | 'info';

@Component({
  selector: 'app-alert-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert-banner.component.html',
  styleUrl: './alert-banner.component.scss',
})
export class AlertBannerComponent {
  type = input<AlertBannerType>('info');
  title = input('');
  message = input('');
  dismissible = input(true);
  dismissed = output<void>();
}
