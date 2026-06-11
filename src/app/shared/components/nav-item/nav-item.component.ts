import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import type { IconSvgObject } from '@hugeicons/angular';
import {
  DashboardCircleIcon,
  HouseHeartIcon,
  UserCircleIcon,
  WalletCardsIcon,
  CubeIcon,
  BankIcon,
  ChartBarBigIcon,
  AlertDiamondIcon,
  UserGroupIcon,
  CogIcon,
  FlashIcon,
  ChevronDownIcon,
} from '@hugeicons/core-free-icons';

export type NavItemIcon =
  | 'dashboard' | 'home' | 'customers' | 'wallet' | 'products'
  | 'loans' | 'reports' | 'risk' | 'teams' | 'settings' | 'quick-action' | 'none';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [HugeiconsIconComponent],
  templateUrl: './nav-item.component.html',
  styleUrls: ['./nav-item.component.scss']
})
export class NavItemComponent {
  @Input() label = '';
  @Input() icon: NavItemIcon = 'none';
  @Input() active = false;
  @Input() hasDropdown = false;
  @Input() expanded = false;
  @Input() variant: 'default' | 'primary-text' = 'default';
  @Output() clicked = new EventEmitter<void>();
  @Output() expandedChange = new EventEmitter<boolean>();

  readonly iconMap: Record<string, IconSvgObject> = {
    dashboard: DashboardCircleIcon,
    home: HouseHeartIcon,
    customers: UserCircleIcon,
    wallet: WalletCardsIcon,
    products: CubeIcon,
    loans: BankIcon,
    reports: ChartBarBigIcon,
    risk: AlertDiamondIcon,
    teams: UserGroupIcon,
    settings: CogIcon,
    'quick-action': FlashIcon,
  };

  readonly chevronIcon: IconSvgObject = ChevronDownIcon;

  onClick() {
    if (this.hasDropdown) {
      this.expanded = !this.expanded;
      this.expandedChange.emit(this.expanded);
    }
    this.clicked.emit();
  }
}
