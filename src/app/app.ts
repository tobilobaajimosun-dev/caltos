import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {
  // Injected here (not just in header/sidebar) so the persisted theme
  // applies on every route, including public auth pages with no shell chrome.
  private readonly theme = inject(ThemeService);
}
