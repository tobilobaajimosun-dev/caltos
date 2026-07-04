import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AvatarComponent } from '../avatar/avatar.component';
import { CommandPaletteComponent, CommandGroup } from '../command-palette/command-palette.component';
import { ThemeService } from '../../services/theme.service';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AvatarComponent, CommandPaletteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class HeaderComponent {
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);
  readonly sidebarState = inject(SidebarStateService);
  private readonly session = inject(SessionService);

  readonly helpMenuOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly commandPaletteOpen = signal(false);

  readonly userName = 'Jesulademi Ajimosun';
  readonly userEmail = 'jesulademi.ajimosun@princepsfinance.com';
  readonly notificationCount = 3;

  readonly commandGroups: CommandGroup[] = [
    { label: 'Navigate', items: [
      { id: 'home', label: 'Go to Home' },
      { id: 'loans', label: 'Go to Loans' },
      { id: 'customers', label: 'Go to Customers' },
      { id: 'reports', label: 'Go to Reports' },
    ]},
    { label: 'Actions', items: [
      { id: 'new-loan', label: 'Create new loan product' },
    ]},
  ];

  onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.commandPaletteOpen.set(true);
    }
  }

  toggleHelpMenu() {
    this.helpMenuOpen.update((v) => !v);
    this.userMenuOpen.set(false);
  }

  toggleUserMenu() {
    this.userMenuOpen.update((v) => !v);
    this.helpMenuOpen.set(false);
  }

  closeMenus() {
    this.helpMenuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  onCommandSelected(id: string) {
    const routeMap: Record<string, string> = {
      home: '/home',
      loans: '/loans',
      customers: '/customers',
      reports: '/reports',
      'new-loan': '/products/create',
    };
    const route = routeMap[id];
    if (route) this.router.navigateByUrl(route);
  }

  signOut() {
    this.closeMenus();
    this.router.navigateByUrl('/login');
  }

  simulateSessionExpiry() {
    this.closeMenus();
    this.session.expire();
  }
}
