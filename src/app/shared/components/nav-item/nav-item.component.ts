import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
import { TooltipComponent } from '../tooltip/tooltip.component';
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
  BriefcaseBusinessIcon,
  ChevronDownIcon,
} from '@hugeicons/core-free-icons';

export type NavItemIcon =
  | 'dashboard' | 'home' | 'customers' | 'wallet' | 'products'
  | 'loans' | 'reports' | 'risk' | 'teams' | 'settings' | 'employers' | 'quick-action' | 'none';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [HiIconComponent, TooltipComponent],
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
  @Input() iconOnly = false;
  @Output() clicked = new EventEmitter<void>();
  @Output() expandedChange = new EventEmitter<boolean>();

  readonly iconMap: Record<string, IconData> = {
    dashboard: DashboardCircleIcon as IconData,
    home: HouseHeartIcon as IconData,
    customers: UserCircleIcon as IconData,
    wallet: WalletCardsIcon as IconData,
    products: CubeIcon as IconData,
    loans: BankIcon as IconData,
    reports: ChartBarBigIcon as IconData,
    risk: AlertDiamondIcon as IconData,
    teams: UserGroupIcon as IconData,
    settings: CogIcon as IconData,
    employers: BriefcaseBusinessIcon as IconData,
    'quick-action': FlashIcon as IconData,
  };

  readonly chevronIcon: IconData = ChevronDownIcon as IconData;

  onClick() {
    if (this.hasDropdown) {
      this.expanded = !this.expanded;
      this.expandedChange.emit(this.expanded);
    }
    this.clicked.emit();
  }
}
