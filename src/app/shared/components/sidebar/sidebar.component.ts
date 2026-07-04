import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavItemComponent, NavItemIcon } from '../nav-item/nav-item.component';
import { OrgProfileComponent } from '../org-profile/org-profile.component';
import { BadgeCardComponent } from '../badge-card/badge-card.component';
import { ToggleComponent } from '../toggle/toggle.component';
import { ThemeService } from '../../services/theme.service';
import { SidebarStateService } from '../../services/sidebar-state.service';

export interface SideNavItem {
  id: string;
  label: string;
  icon: NavItemIcon;
  route?: string;
  hasDropdown?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NavItemComponent, OrgProfileComponent, BadgeCardComponent, ToggleComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  readonly theme = inject(ThemeService);
  readonly sidebarState = inject(SidebarStateService);

  @Input() orgName = 'Princeps Finance';
  @Input() activeItemId = 'quick-actions';
  @Output() navChange = new EventEmitter<string>();

  collapsed = false;

  navItems: SideNavItem[] = [
    { id: 'quick-actions', label: 'Quick Actions', icon: 'dashboard', route: '/' },
    { id: 'home',          label: 'Home',                icon: 'home',      route: '/home' },
    { id: 'customers',     label: 'Customers',           icon: 'customers' },
    { id: 'wallet',        label: 'Wallet',              icon: 'wallet' },
    { id: 'products',      label: 'Products',            icon: 'products',  route: '/products' },
    { id: 'loans',         label: 'Loans',               icon: 'loans',     route: '/loans', hasDropdown: true },
    { id: 'reports',       label: 'Reports & Performance', icon: 'reports', route: '/reports' },
    { id: 'risk',          label: 'Risk Monitor',        icon: 'risk',      route: '/collections' },
    { id: 'employers',     label: 'Employers',           icon: 'employers', route: '/employers' },
    { id: 'teams',         label: 'Teams',               icon: 'teams' },
    { id: 'settings',      label: 'Settings',            icon: 'settings',  route: '/settings/alerts' },
  ];

  constructor(private router: Router) {}

  navigate(item: SideNavItem) {
    this.activeItemId = item.id;
    this.navChange.emit(item.id);
    if (item.route) this.router.navigate([item.route]);
    this.sidebarState.close();
  }
}
