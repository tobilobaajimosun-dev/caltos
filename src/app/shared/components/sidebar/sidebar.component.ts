import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NavItemComponent, NavItemIcon } from '../nav-item/nav-item.component';
import { OrgProfileComponent } from '../org-profile/org-profile.component';
import { BadgeCardComponent } from '../badge-card/badge-card.component';

export interface SideNavItem {
  id: string;
  label: string;
  icon: NavItemIcon;
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

  navItems: SideNavItem[] = [
    { id: 'quick-actions', label: 'Quick Actions', icon: 'dashboard' },
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'customers', label: 'Customers', icon: 'customers' },
    { id: 'wallet', label: 'Wallet', icon: 'wallet' },
    { id: 'products', label: 'Products', icon: 'products' },
    { id: 'loans', label: 'Loans', icon: 'loans', hasDropdown: true },
    { id: 'reports', label: 'Reports & Performance', icon: 'reports' },
    { id: 'risk', label: 'Risk Monitor', icon: 'risk' },
    { id: 'teams', label: 'Teams', icon: 'teams' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  navigate(id: string) {
    this.activeItemId = id;
    this.navChange.emit(id);
  }
}
