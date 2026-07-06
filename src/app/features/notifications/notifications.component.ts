import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ColumnTitleComponent,
  TableItemComponent,
  ButtonComponent,
  SelectComponent,
  SelectOption,
} from '../../shared/components';
import { HiIconComponent } from '../../shared/components/hi-icon/hi-icon.component';
import { NotificationService, NotificationCategory, NotificationItem } from '../../shared/services/notification.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [ColumnTitleComponent, TableItemComponent, ButtonComponent, SelectComponent, HiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsPageComponent {
  readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly categoryFilter = signal<NotificationCategory | 'all'>('all');
  readonly statusFilter = signal<'all' | 'unread' | 'read'>('all');

  readonly categoryOptions: SelectOption[] = [
    { value: 'all', label: 'All types' },
    { value: 'loans', label: 'Loans' },
    { value: 'customers', label: 'Customers' },
    { value: 'wallet', label: 'Wallet' },
    { value: 'system', label: 'System' },
    { value: 'mentions', label: 'Mentions' },
  ];

  readonly statusOptions: SelectOption[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
  ];

  readonly filtered = computed(() => {
    let list = this.notifications.notifications();
    if (this.categoryFilter() !== 'all') list = list.filter((n) => n.category === this.categoryFilter());
    if (this.statusFilter() === 'unread') list = list.filter((n) => !n.read);
    if (this.statusFilter() === 'read') list = list.filter((n) => n.read);
    return list;
  });

  readonly selectedIds = signal(new Set<string>());

  toggleSelect(id: string, checked: boolean) {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  readonly allSelected = computed(() => this.filtered().length > 0 && this.filtered().every((n) => this.selectedIds().has(n.id)));

  toggleSelectAll() {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.filtered().map((n) => n.id)));
    }
  }

  bulkMarkRead() {
    for (const id of this.selectedIds()) this.notifications.markAsRead(id);
    this.selectedIds.set(new Set());
  }

  bulkDelete() {
    this.notifications.dismissAll(Array.from(this.selectedIds()));
    this.selectedIds.set(new Set());
  }

  open(n: NotificationItem) {
    this.notifications.markAsRead(n.id);
    this.router.navigateByUrl(n.link);
  }
}
