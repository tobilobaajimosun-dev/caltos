import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

const LABELS: Record<string, string> = {
  home: 'Home', products: 'Products', loans: 'Loans', collections: 'Collections',
  reports: 'Reports', employers: 'Employers', settings: 'Settings', mandates: 'Mandates',
  recovery: 'Recovery', alerts: 'Alerts', create: 'Create', reconciliation: 'Reconciliation',
  exceptions: 'Exceptions', escalations: 'Escalations', bulk: 'Bulk', showcase: 'Component Showcase',
  'create-bnpl': 'Create BNPL',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, BreadcrumbComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  readonly navigating = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationStart || e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
      map((e) => e instanceof NavigationStart),
    ),
    { initialValue: false },
  );

  readonly breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const segments = this.currentUrl().split('/').filter(Boolean);
    if (!segments.length) return [];
    return segments.map((seg, i) => {
      const isLast = i === segments.length - 1;
      const label = LABELS[seg] ?? (seg.length > 14 ? 'Details' : seg.charAt(0).toUpperCase() + seg.slice(1));
      return { label, link: isLast ? undefined : '/' + segments.slice(0, i + 1).join('/') };
    });
  });
}
