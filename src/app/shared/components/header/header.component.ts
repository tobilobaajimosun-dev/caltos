import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AvatarComponent } from '../avatar/avatar.component';
import { CommandPaletteComponent, CommandGroup } from '../command-palette/command-palette.component';
import { ToggleComponent } from '../toggle/toggle.component';
import { ThemeService } from '../../services/theme.service';
import { SidebarStateService } from '../../services/sidebar-state.service';

interface OrgOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AvatarComponent, CommandPaletteComponent, ToggleComponent],
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

  readonly orgMenuOpen = signal(false);
  readonly helpMenuOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly commandPaletteOpen = signal(false);

  readonly currentOrg = signal('Princeps Finance');
  readonly orgs: OrgOption[] = [
    { id: 'princeps', name: 'Princeps Finance' },
    { id: 'northwind', name: 'Northwind SACCO' },
  ];

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

  toggleOrgMenu() {
    this.orgMenuOpen.update((v) => !v);
    this.helpMenuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  toggleHelpMenu() {
    this.helpMenuOpen.update((v) => !v);
    this.orgMenuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  toggleUserMenu() {
    this.userMenuOpen.update((v) => !v);
    this.orgMenuOpen.set(false);
    this.helpMenuOpen.set(false);
  }

  closeMenus() {
    this.orgMenuOpen.set(false);
    this.helpMenuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  selectOrg(org: OrgOption) {
    this.currentOrg.set(org.name);
    this.orgMenuOpen.set(false);
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
    this.router.navigateByUrl('/');
  }
}
