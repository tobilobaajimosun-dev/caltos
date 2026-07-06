import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import type { IconSvgObject } from '@hugeicons/angular';
import { TooltipComponent } from '../tooltip/tooltip.component';
import {
  DashboardSquare02Icon,
  Home13Icon,
  UserMultiple02Icon,
  Wallet03Icon,
  FolderCogIcon,
  WalletDone02Icon,
  Analytics02Icon,
  MonitorDotIcon,
  UserGroup03Icon,
  Settings02Icon,
  FlashIcon,
  CalendarCheckIn01Icon,
  Wrench01Icon,
  ChevronDownIcon,
} from '@hugeicons/core-free-icons';

export type NavItemIcon =
  | 'dashboard' | 'home' | 'customers' | 'wallet' | 'products'
  | 'loans' | 'reports' | 'risk' | 'teams' | 'settings' | 'repayments' | 'utilities' | 'quick-action' | 'none';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [HugeiconsIconComponent, TooltipComponent],
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

  readonly iconMap: Record<string, IconSvgObject> = {
    dashboard: DashboardSquare02Icon as IconSvgObject,
    home: Home13Icon as IconSvgObject,
    customers: UserMultiple02Icon as IconSvgObject,
    wallet: Wallet03Icon as IconSvgObject,
    products: FolderCogIcon as IconSvgObject,
    loans: WalletDone02Icon as IconSvgObject,
    reports: Analytics02Icon as IconSvgObject,
    risk: MonitorDotIcon as IconSvgObject,
    teams: UserGroup03Icon as IconSvgObject,
    settings: Settings02Icon as IconSvgObject,
    repayments: CalendarCheckIn01Icon as IconSvgObject,
    utilities: Wrench01Icon as IconSvgObject,
    'quick-action': FlashIcon as IconSvgObject,
  };

  readonly chevronIcon: IconSvgObject = ChevronDownIcon as IconSvgObject;

  onClick() {
    if (this.hasDropdown) {
      this.expanded = !this.expanded;
      this.expandedChange.emit(this.expanded);
    }
    this.clicked.emit();
  }
}
