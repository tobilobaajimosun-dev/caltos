import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { NavItemComponent, NavItemIcon } from '../nav-item/nav-item.component';
import { OrgProfileComponent } from '../org-profile/org-profile.component';
import { BadgeCardComponent } from '../badge-card/badge-card.component';

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
  imports: [NavItemComponent, OrgProfileComponent, BadgeCardComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
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
    { id: 'loans',         label: 'Loans',               icon: 'loans',     hasDropdown: true },
    { id: 'reports',       label: 'Reports & Performance', icon: 'reports' },
    { id: 'risk',          label: 'Risk Monitor',        icon: 'risk' },
    { id: 'teams',         label: 'Teams',               icon: 'teams' },
    { id: 'settings',      label: 'Settings',            icon: 'settings' },
  ];

  constructor(private router: Router) {}

  navigate(item: SideNavItem) {
    this.activeItemId = item.id;
    this.navChange.emit(item.id);
    if (item.route) this.router.navigate([item.route]);
  }
}
