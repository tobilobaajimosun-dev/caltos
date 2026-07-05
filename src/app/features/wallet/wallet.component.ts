import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent, ColumnTitleComponent, TableItemComponent, PaginationComponent,
  ModalComponent, SelectComponent, SelectOption, CheckboxComponent, ToggleComponent, BadgeStatus,
} from '../../shared/components';
import { AccountService } from '../../shared/services/account.service';

interface WalletTransaction {
  date: string;
  time: string;
  narration: string;
  txnId: string;
  amount: string;
  status: BadgeStatus;
  balanceAfter: string;
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    FormsModule, ButtonComponent, ColumnTitleComponent, TableItemComponent, PaginationComponent,
    ModalComponent, SelectComponent, CheckboxComponent, ToggleComponent,
  ],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss',
})
export class WalletComponent {
  readonly account = inject(AccountService);

  readonly balanceHidden = signal(false);
  readonly notifSettingsOpen = signal(false);

  readonly periodOptions: SelectOption[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];
  fundsInPeriod = 'today';
  fundsOutPeriod = 'today';

  readonly lastFundedAmount = '₦182,756,352.10';
  readonly lastFundedDate = '03-Mar-2025 03:34pm';

  readonly fundsIn = '₦100,756,352.10';
  readonly fundsOut = '₦100,756,352.10';

  // Notification settings form state
  lowBalanceThreshold = '';
  emailNotify = false;
  inAppNotify = false;
  dailySummary = false;

  currentPage = 1;
  pageSize = 10;

  readonly transactions: WalletTransaction[] = [
    { date: 'June 5, 2024', time: '3:15pm', narration: 'Wallet top-up via Radix', txnId: 'TXN-9F35A2C0', amount: '₦80,010.00', status: 'successful', balanceAfter: '₦75,000.00' },
    { date: 'June 5, 2024', time: '3:15pm', narration: 'Wallet top-up via Radix', txnId: 'TXN-9F35A2C1', amount: '₦82,500.00', status: 'failed', balanceAfter: '₦70,000.00' },
    { date: 'June 5, 2024', time: '3:15pm', narration: 'Wallet top-up via Radix', txnId: 'TXN-9F35A2C2', amount: '₦85,000.00', status: 'pending', balanceAfter: '₦65,000.00' },
    { date: 'June 4, 2024', time: '11:02am', narration: 'Wallet top-up via Radix', txnId: 'TXN-9F35A2C3', amount: '₦45,000.00', status: 'successful', balanceAfter: '₦60,000.00' },
    { date: 'June 4, 2024', time: '9:47am', narration: 'Wallet top-up via Radix', txnId: 'TXN-9F35A2C4', amount: '₦30,000.00', status: 'successful', balanceAfter: '₦15,000.00' },
  ];

  toggleBalanceVisibility() {
    this.balanceHidden.update((v) => !v);
  }

  get maskedBalance(): string {
    return this.balanceHidden() ? '₦••••••••••' : this.account.balance();
  }

  openNotifSettings() {
    this.notifSettingsOpen.set(true);
  }

  closeNotifSettings() {
    this.notifSettingsOpen.set(false);
  }

  saveNotifSettings() {
    this.notifSettingsOpen.set(false);
  }
}
