import { Injectable, computed, signal } from '@angular/core';
import { IconData } from '../components/hi-icon/hi-icon.component';
import {
  CheckmarkCircle02Icon,
  MoneySend01Icon,
  Alert01Icon,
  MoneyReceive01Icon,
  Wallet01Icon,
  FileValidationIcon,
  BellRingIcon,
  UserAdd01Icon,
  Settings01Icon,
} from '@hugeicons/core-free-icons';

export type NotificationCategory = 'loans' | 'customers' | 'wallet' | 'system' | 'mentions';
export type NotificationUrgency = 'normal' | 'high' | 'urgent';
export type NotificationIconType =
  | 'approved' | 'disbursed' | 'overdue' | 'repayment' | 'wallet-low'
  | 'application' | 'approval-required' | 'team-invite' | 'system';

/** Single source of truth mapping a notification type to its hugeicons icon. */
export const NOTIFICATION_ICON_MAP: Record<NotificationIconType, IconData> = {
  approved: CheckmarkCircle02Icon as IconData,
  disbursed: MoneySend01Icon as IconData,
  overdue: Alert01Icon as IconData,
  repayment: MoneyReceive01Icon as IconData,
  'wallet-low': Wallet01Icon as IconData,
  application: FileValidationIcon as IconData,
  'approval-required': BellRingIcon as IconData,
  'team-invite': UserAdd01Icon as IconData,
  system: Settings01Icon as IconData,
};

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  urgency: NotificationUrgency;
  icon: NotificationIconType;
  title: string;
  subtitle: string;
  at: string;
  read: boolean;
  link: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<NotificationItem[]>([
    { id: 'n1', category: 'loans', urgency: 'normal', icon: 'approved', title: 'Loan approved', subtitle: 'MTG Logistics loan approved — ₦500,000', at: this.minutesAgo(2), read: false, link: '/loans/processing' },
    { id: 'n2', category: 'wallet', urgency: 'normal', icon: 'disbursed', title: 'Loan disbursed', subtitle: '₦200,000 disbursed to Adeniyi Kabiru', at: this.minutesAgo(40), read: false, link: '/wallet' },
    { id: 'n3', category: 'loans', urgency: 'high', icon: 'overdue', title: 'Loans overdue', subtitle: '3 loans are now overdue — ₦450,000 at risk', at: this.hoursAgo(3), read: false, link: '/collections' },
    { id: 'n4', category: 'loans', urgency: 'normal', icon: 'repayment', title: 'Repayment received', subtitle: '₦45,000 repayment received from J. Adewale', at: this.hoursAgo(5), read: true, link: '/loans/repayments' },
    { id: 'n5', category: 'wallet', urgency: 'urgent', icon: 'wallet-low', title: 'Wallet balance low', subtitle: 'Wallet balance below ₦100,000 — top up needed', at: this.hoursAgo(6), read: false, link: '/wallet' },
    { id: 'n6', category: 'loans', urgency: 'normal', icon: 'application', title: 'New application', subtitle: 'New loan application from Fatima Suleiman', at: this.daysAgo(1), read: false, link: '/loans/processing' },
    { id: 'n7', category: 'loans', urgency: 'high', icon: 'approval-required', title: 'Approval required', subtitle: '2 loans pending your approval', at: this.daysAgo(1), read: true, link: '/loans/processing' },
    { id: 'n8', category: 'mentions', urgency: 'normal', icon: 'team-invite', title: 'Team invite sent', subtitle: 'You invited Bode Okafor to the team', at: this.daysAgo(4), read: true, link: '/teams' },
    { id: 'n9', category: 'system', urgency: 'urgent', icon: 'system', title: 'System alert', subtitle: 'Remita integration disconnected', at: this.daysAgo(6), read: true, link: '/settings' },
  ]);

  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  /** Resolves a notification's icon type to its hugeicons IconData. */
  iconFor(icon: NotificationIconType): IconData {
    return NOTIFICATION_ICON_MAP[icon];
  }

  private minutesAgo(mins: number): string {
    return new Date(Date.now() - mins * 60_000).toISOString();
  }
  private hoursAgo(hrs: number): string {
    return new Date(Date.now() - hrs * 3_600_000).toISOString();
  }
  private daysAgo(days: number): string {
    return new Date(Date.now() - days * 86_400_000).toISOString();
  }

  markAsRead(id: string) {
    this.notifications.update((all) => all.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  markAllRead() {
    this.notifications.update((all) => all.map((n) => ({ ...n, read: true })));
  }

  dismiss(id: string) {
    this.notifications.update((all) => all.filter((n) => n.id !== id));
  }

  dismissAll(ids: string[]) {
    this.notifications.update((all) => all.filter((n) => !ids.includes(n.id)));
  }

  relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }

  timeGroup(iso: string): 'Today' | 'Yesterday' | 'This Week' | 'Earlier' {
    const diffMs = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diffMs / 86_400_000);
    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return 'This Week';
    return 'Earlier';
  }
}
