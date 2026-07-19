import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AvatarComponent } from '../avatar/avatar.component';
import { CommandPaletteComponent, CommandGroup, CommandItem } from '../command-palette/command-palette.component';
import { ButtonComponent } from '../button/button.component';
import { ThemeService } from '../../services/theme.service';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { SessionService } from '../../services/session.service';
import { AccountService } from '../../services/account.service';
import { NotificationService } from '../../services/notification.service';
import { CustomersService } from '../../services/customers.service';
import { ProductsService } from '../../services/products.service';
import { QuickActionsService } from '../../services/quick-actions.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';

@Component({
  selector: 'app-header',
  imports: [AvatarComponent, CommandPaletteComponent, ButtonComponent, NotificationPanelComponent],
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
  readonly account = inject(AccountService);
  readonly notifications = inject(NotificationService);
  private readonly customersService = inject(CustomersService);
  private readonly productsService = inject(ProductsService);
  private readonly quickActionsService = inject(QuickActionsService);

  readonly userMenuOpen = signal(false);
  readonly commandPaletteOpen = signal(false);
  readonly notificationPanelOpen = signal(false);

  readonly userName = 'Jesulademi Ajimosun';
  readonly userEmail = 'jesulademi.ajimosun@princepsfinance.com';

  private readonly navigateGroup: CommandGroup = {
    label: 'Navigate',
    items: [
      { id: 'nav:home', label: 'Go to Home' },
      { id: 'nav:loans', label: 'Go to Loans' },
      { id: 'nav:customers', label: 'Go to Customers' },
      { id: 'nav:products', label: 'Go to Products' },
      { id: 'nav:reports', label: 'Go to Reports' },
      { id: 'nav:wallet', label: 'Go to Wallet' },
      { id: 'nav:quick-actions', label: 'Go to Quick Actions' },
    ],
  };

  private readonly actionsGroup = computed<CommandGroup>(() => ({
    label: 'Actions',
    items: this.quickActionsService.actions.map((a) => ({
      id: `action:${a.id}`,
      label: a.title,
      sublabel: a.category,
    })),
  }));

  private readonly customersGroup = computed<CommandGroup>(() => ({
    label: 'Customers',
    items: this.customersService.customers().map((c) => ({
      id: `customer:${c.id}`,
      label: c.name,
      sublabel: c.product,
    })),
  }));

  private readonly loansGroup = computed<CommandGroup>(() => ({
    label: 'Loans',
    items: this.customersService
      .customers()
      .flatMap((c) => c.loans.map((loan) => ({
        id: `loan:${loan.id}`,
        label: `${loan.product} — ${c.name}`,
        sublabel: loan.status,
      }))),
  }));

  private readonly productsGroup = computed<CommandGroup>(() => ({
    label: 'Products',
    items: this.productsService.products().map((p) => ({
      id: `product:${p.id}`,
      label: p.name,
      sublabel: p.status,
    })),
  }));

  readonly commandGroups = computed<CommandGroup[]>(() => [
    this.navigateGroup,
    this.actionsGroup(),
    this.customersGroup(),
    this.loansGroup(),
    this.productsGroup(),
  ]);

  readonly recentItems = computed<CommandItem[]>(() =>
    this.quickActionsService.recentActions().map((a) => ({
      id: `action:${a.id}`,
      label: a.title,
      sublabel: a.category,
    })),
  );

  onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.commandPaletteOpen.set(true);
    }
  }

  toggleUserMenu() {
    this.userMenuOpen.update((v) => !v);
  }

  toggleNotificationPanel() {
    this.notificationPanelOpen.update((v) => !v);
  }

  closeMenus() {
    this.userMenuOpen.set(false);
  }

  onCommandSelected(id: string) {
    const [kind, value] = id.split(':', 2);

    switch (kind) {
      case 'nav': {
        const routeMap: Record<string, string> = {
          home: '/home',
          loans: '/loans',
          customers: '/customers',
          products: '/products',
          reports: '/reports',
          wallet: '/wallet',
          'quick-actions': '/quick-actions',
        };
        const route = routeMap[value];
        if (route) this.router.navigateByUrl(route);
        return;
      }
      case 'action': {
        const action = this.quickActionsService.getById(value);
        if (!action) return;
        this.quickActionsService.recordRecent(action.id);
        this.router.navigateByUrl(action.route);
        return;
      }
      case 'customer': {
        this.router.navigateByUrl(`/customers/${value}`);
        return;
      }
      case 'loan': {
        this.router.navigateByUrl(`/loans/${value}`);
        return;
      }
      case 'product': {
        this.router.navigateByUrl(`/products/${value}`);
        return;
      }
    }
  }

  signOut() {
    this.closeMenus();
    this.router.navigateByUrl('/login');
  }

  giveLoan() {
    this.router.navigateByUrl('/loans');
  }

  simulateSessionExpiry() {
    this.closeMenus();
    this.session.expire();
  }
}
