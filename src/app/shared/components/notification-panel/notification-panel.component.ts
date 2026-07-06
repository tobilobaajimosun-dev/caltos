import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService, NotificationCategory, NotificationItem } from '../../services/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
})
export class NotificationPanelComponent {
  readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly isOpen = input(false);
  readonly closed = output<void>();

  readonly activeCategory = signal<NotificationCategory | 'all'>('all');

  readonly categoryTabs: { label: string; value: NotificationCategory | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Loans', value: 'loans' },
    { label: 'Customers', value: 'customers' },
    { label: 'Wallet', value: 'wallet' },
    { label: 'System', value: 'system' },
    { label: 'Mentions', value: 'mentions' },
  ];

  readonly filtered = computed(() => {
    const cat = this.activeCategory();
    const list = this.notifications.notifications();
    return cat === 'all' ? list : list.filter((n) => n.category === cat);
  });

  readonly grouped = computed(() => {
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'] as const;
    const groups = new Map<string, NotificationItem[]>();
    for (const n of this.filtered()) {
      const g = this.notifications.timeGroup(n.at);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(n);
    }
    return order.filter((g) => groups.has(g)).map((g) => ({ label: g, items: groups.get(g)! }));
  });

  setCategory(cat: NotificationCategory | 'all') {
    this.activeCategory.set(cat);
  }

  close() {
    this.closed.emit();
  }

  iconGlyph(icon: NotificationItem['icon']): string {
    switch (icon) {
      case 'approved': return '✅';
      case 'disbursed': return '💸';
      case 'overdue': return '⚠️';
      case 'repayment': return '💰';
      case 'wallet-low': return '🔴';
      case 'application': return '📋';
      case 'approval-required': return '🔔';
      case 'team-invite': return '👤';
      case 'system': return '🔧';
    }
  }

  select(n: NotificationItem) {
    this.notifications.markAsRead(n.id);
    this.close();
    this.router.navigateByUrl(n.link);
  }

  dismiss(event: Event, id: string) {
    event.stopPropagation();
    this.notifications.dismiss(id);
  }

  markAllRead() {
    this.notifications.markAllRead();
  }

  viewAll() {
    this.close();
    this.router.navigateByUrl('/notifications');
  }

  goToSettings() {
    this.close();
    this.router.navigateByUrl('/settings/alerts');
  }
}
