import { Component, Input, Output, EventEmitter, inject, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { NavItemComponent, NavItemIcon } from '../nav-item/nav-item.component';
import { OrgProfileComponent } from '../org-profile/org-profile.component';
import { BadgeCardComponent } from '../badge-card/badge-card.component';
import { ToggleComponent } from '../toggle/toggle.component';
import { ModalComponent } from '../modal/modal.component';
import { ThemeService } from '../../services/theme.service';
import { SidebarStateService } from '../../services/sidebar-state.service';

export interface SideNavChild {
  label: string;
  route: string;
  queryParams?: Record<string, string>;
}

interface OrgOption {
  id: string;
  name: string;
  color: string;
}

export interface SideNavItem {
  id: string;
  label: string;
  icon: NavItemIcon;
  route?: string;
  hasDropdown?: boolean;
  children?: SideNavChild[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NavItemComponent, OrgProfileComponent, BadgeCardComponent, ToggleComponent, ModalComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);
  readonly sidebarState = inject(SidebarStateService);

  @Input() orgName = 'Princeps Finance';
  @Input() activeItemId = 'quick-actions';
  @Output() navChange = new EventEmitter<string>();

  collapsed = false;
  private readonly expandedIds = signal<ReadonlySet<string>>(new Set());

  readonly switchOrgOpen = signal(false);
  readonly orgs: OrgOption[] = [
    { id: 'princeps', name: 'Princeps Finance', color: '#E55A2B' },
    { id: 'northwind', name: 'Northwind SACCO', color: '#0053A6' },
  ];

  navItems: SideNavItem[] = [
    { id: 'quick-actions', label: 'Quick Actions', icon: 'dashboard', route: '/' },
    { id: 'home',          label: 'Home',                icon: 'home',      route: '/home' },
    { id: 'customers',     label: 'Customers',           icon: 'customers' },
    { id: 'wallet',        label: 'Wallet',              icon: 'wallet' },
    { id: 'products',      label: 'Products',            icon: 'products',  route: '/products' },
    {
      id: 'loans', label: 'Loans', icon: 'loans', route: '/loans', hasDropdown: true,
      children: [
        { label: 'All Loans', route: '/loans' },
        { label: 'Pending Approval', route: '/loans', queryParams: { status: 'pending' } },
        { label: 'Overdue', route: '/loans', queryParams: { status: 'overdue' } },
      ],
    },
    { id: 'reports',       label: 'Reports & Performance', icon: 'reports', route: '/reports' },
    { id: 'risk',          label: 'Risk Monitor',        icon: 'risk',      route: '/collections' },
    { id: 'employers',     label: 'Employers',           icon: 'employers', route: '/employers' },
    { id: 'teams',         label: 'Teams',               icon: 'teams' },
    { id: 'settings',      label: 'Settings',            icon: 'settings',  route: '/settings/alerts' },
  ];

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  readonly routeActiveId = computed(() => {
    const url = this.currentUrl();
    const candidates = this.navItems.filter((i) => i.route && (i.route === url || (i.route !== '/' && url.startsWith(i.route + '/'))));
    if (!candidates.length) return null;
    return candidates.reduce((best, cur) => (cur.route!.length > best.route!.length ? cur : best)).id;
  });

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  toggleExpanded(item: SideNavItem) {
    this.expandedIds.update((set) => {
      const next = new Set(set);
      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
      return next;
    });
  }

  isActive(item: SideNavItem): boolean {
    const routeId = this.routeActiveId();
    return routeId ? routeId === item.id : this.activeItemId === item.id;
  }

  navigate(item: SideNavItem) {
    this.activeItemId = item.id;
    this.navChange.emit(item.id);
    if (item.hasDropdown) this.toggleExpanded(item);
    if (item.route) this.router.navigate([item.route]);
    this.sidebarState.close();
  }

  navigateChild(child: SideNavChild) {
    this.router.navigate([child.route], { queryParams: child.queryParams ?? {} });
    this.sidebarState.close();
  }

  selectOrg(org: OrgOption) {
    this.orgName = org.name;
    this.switchOrgOpen.set(false);
  }
}
