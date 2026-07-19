import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Download01Icon, MoneySend01Icon, Search01Icon, SignatureIcon, SmartPhone01Icon } from '@hugeicons/core-free-icons';
import {
  ButtonComponent, ColumnTitleComponent, TableItemComponent, PaginationComponent,
  ModalComponent, SelectComponent, SelectOption, CheckboxComponent, ToggleComponent, BadgeStatus, IconData,
  SearchComponent, InputComponent, FileUploadComponent, AlertBannerComponent, StatusBadgeComponent,
  DrawerComponent,
} from '../../shared/components';
import { HiIconComponent } from '../../shared/components/hi-icon/hi-icon.component';
import { AccountService } from '../../shared/services/account.service';

type TxnType = 'Disbursement' | 'Check Fee' | 'Digisign' | 'Top-Up' | 'Withdrawal';

interface WalletTransaction {
  date: string;
  time: string;
  narration: string;
  txnId: string;
  type: TxnType;
  amount: string;
  status: BadgeStatus;
  balanceAfter: string;
}

interface TopUpRecord {
  date: string;
  reference: string;
  amount: string;
  status: BadgeStatus;
}

interface SpendLineItem {
  date: string;
  description: string;
  reference: string;
  amount: string;
}

interface SpendCategory {
  icon: IconData;
  label: string;
  amount: string;
  items: SpendLineItem[];
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    FormsModule, ButtonComponent, ColumnTitleComponent, TableItemComponent, PaginationComponent,
    ModalComponent, SelectComponent, CheckboxComponent, ToggleComponent, SearchComponent, InputComponent,
    FileUploadComponent, AlertBannerComponent, StatusBadgeComponent, HiIconComponent, DrawerComponent,
  ],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss',
})
export class WalletComponent {
  readonly account = inject(AccountService);

  readonly downloadIcon: IconData = Download01Icon as IconData;
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

  // ── Reserved balance ──
  readonly reservedDisbursements = 4_500_000;
  readonly reservedChecks = 320_000;
  readonly reservedTotal = computed(() => this.reservedDisbursements + this.reservedChecks);

  private parseAmount(value: string): number {
    return Number(value.replace(/[^\d.]/g, '')) || 0;
  }

  readonly availableBalance = computed(() => this.parseAmount(this.account.balance()) - this.reservedTotal());

  // ── Low balance alert ──
  lowBalanceThreshold = '150000000';
  readonly lowBalanceActive = computed(() => this.parseAmount(this.account.balance()) < (Number(this.lowBalanceThreshold) || 0));

  // ── Spend summary ──
  readonly spendCategories: SpendCategory[] = [
    {
      icon: MoneySend01Icon as IconData,
      label: 'Disbursements',
      amount: '₦4,200,000',
      items: [
        { date: 'Jul 15, 2026', description: 'Salary Advance — Akpan A.', reference: 'DSB-20941', amount: '₦850,000' },
        { date: 'Jul 12, 2026', description: 'Payday Loan — Chioma N.', reference: 'DSB-20918', amount: '₦1,200,000' },
        { date: 'Jul 09, 2026', description: 'Salary Advance — Bello M.', reference: 'DSB-20897', amount: '₦640,000' },
        { date: 'Jul 05, 2026', description: 'Device Finance — Eze K.', reference: 'DSB-20860', amount: '₦910,000' },
        { date: 'Jul 02, 2026', description: 'Salary Advance — Okoro T.', reference: 'DSB-20833', amount: '₦600,000' },
      ],
    },
    {
      icon: Search01Icon as IconData,
      label: 'Eligibility Checks',
      amount: '₦12,400',
      items: [
        { date: 'Jul 16, 2026', description: 'Remita eligibility check — batch of 7', reference: 'CHK-5521', amount: '₦5,950' },
        { date: 'Jul 10, 2026', description: 'Remita eligibility check — batch of 5', reference: 'CHK-5488', amount: '₦4,250' },
        { date: 'Jul 03, 2026', description: 'Priority eligibility check — Bello M.', reference: 'CHK-5450', amount: '₦1,350' },
        { date: 'Jul 01, 2026', description: 'Single eligibility check — Eze K.', reference: 'CHK-5441', amount: '₦850' },
      ],
    },
    {
      icon: SignatureIcon as IconData,
      label: 'Digisign Fees',
      amount: '₦3,800',
      items: [
        { date: 'Jul 14, 2026', description: 'Offer letter e-signature — Chioma N.', reference: 'DSG-1188', amount: '₦1,200' },
        { date: 'Jul 08, 2026', description: 'Loan agreement e-signature — Akpan A.', reference: 'DSG-1174', amount: '₦1,200' },
        { date: 'Jul 02, 2026', description: 'Guarantor consent e-signature', reference: 'DSG-1161', amount: '₦1,400' },
      ],
    },
    {
      icon: SmartPhone01Icon as IconData,
      label: 'SMS/Notifications',
      amount: '₦950',
      items: [
        { date: 'Jul 15, 2026', description: 'Repayment reminder SMS — batch of 120', reference: 'SMS-90312', amount: '₦480' },
        { date: 'Jul 08, 2026', description: 'Disbursement alert SMS — batch of 65', reference: 'SMS-90267', amount: '₦260' },
        { date: 'Jul 01, 2026', description: 'OTP delivery — 52 messages', reference: 'SMS-90201', amount: '₦210' },
      ],
    },
  ];

  readonly spendDetailOpen = signal(false);
  readonly activeSpendCategory = signal<SpendCategory | null>(null);

  openSpendDetail(cat: SpendCategory) {
    this.activeSpendCategory.set(cat);
    this.spendDetailOpen.set(true);
  }

  closeSpendDetail() {
    this.spendDetailOpen.set(false);
  }

  // Notification settings form state
  emailNotify = false;
  inAppNotify = false;
  dailySummary = false;

  currentPage = 1;
  pageSize = 10;

  readonly transactions = signal<WalletTransaction[]>([
    { date: 'June 5, 2024', time: '3:15pm', narration: 'Wallet top-up via Radix', txnId: 'TXN-9F35A2C0', type: 'Top-Up', amount: '₦80,010.00', status: 'successful', balanceAfter: '₦75,000.00' },
    { date: 'June 5, 2024', time: '3:15pm', narration: 'Salary Advance disbursed — Akpan A.', txnId: 'TXN-9F35A2C1', type: 'Disbursement', amount: '-₦82,500.00', status: 'failed', balanceAfter: '₦70,000.00' },
    { date: 'June 5, 2024', time: '3:15pm', narration: 'Remita eligibility check', txnId: 'TXN-9F35A2C2', type: 'Check Fee', amount: '-₦850.00', status: 'pending', balanceAfter: '₦65,000.00' },
    { date: 'June 4, 2024', time: '11:02am', narration: 'Digisign offer letter fee', txnId: 'TXN-9F35A2C3', type: 'Digisign', amount: '-₦1,200.00', status: 'successful', balanceAfter: '₦60,000.00' },
    { date: 'June 4, 2024', time: '9:47am', narration: 'Withdrawal to GTBank ****4521', txnId: 'TXN-9F35A2C4', type: 'Withdrawal', amount: '-₦30,000.00', status: 'successful', balanceAfter: '₦15,000.00' },
  ]);

  readonly searchQuery = signal('');
  readonly typeFilter = signal<'all' | TxnType>('all');

  readonly typeOptions: SelectOption[] = [
    { value: 'all', label: 'All types' },
    { value: 'Disbursement', label: 'Disbursement' },
    { value: 'Check Fee', label: 'Check Fee' },
    { value: 'Digisign', label: 'Digisign' },
    { value: 'Top-Up', label: 'Top-Up' },
    { value: 'Withdrawal', label: 'Withdrawal' },
  ];

  readonly filteredTransactions = computed(() => {
    let list = this.transactions();
    if (this.typeFilter() !== 'all') list = list.filter((t) => t.type === this.typeFilter());
    const q = this.searchQuery().trim().toLowerCase();
    if (q) list = list.filter((t) => t.narration.toLowerCase().includes(q) || t.txnId.toLowerCase().includes(q));
    return list;
  });

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

  // ── Top-up flow (3 steps) ──
  readonly topUpOpen = signal(false);
  readonly topUpStep = signal(0);
  readonly topUpAmountChips = ['₦50,000', '₦100,000', '₦500,000', '₦1,000,000'];
  readonly topUpAmount = signal('');
  readonly topUpCustomAmount = signal('');
  readonly topUpReference = signal('');
  readonly topUpProofFile = signal<File | null>(null);

  readonly topUpHistory = signal<TopUpRecord[]>([
    { date: '2026-07-01 09:20', reference: 'TU-88213', amount: '₦500,000', status: 'successful' },
    { date: '2026-06-20 14:05', reference: 'TU-88104', amount: '₦1,000,000', status: 'successful' },
    { date: '2026-06-05 08:40', reference: 'TU-87990', amount: '₦100,000', status: 'failed' },
  ]);

  openTopUp() {
    this.topUpStep.set(0);
    this.topUpAmount.set('');
    this.topUpCustomAmount.set('');
    this.topUpProofFile.set(null);
    this.topUpReference.set(`TU-${Math.floor(10000 + Math.random() * 89999)}`);
    this.topUpOpen.set(true);
  }

  closeTopUp() {
    this.topUpOpen.set(false);
  }

  selectTopUpChip(chip: string) {
    this.topUpAmount.set(chip);
    this.topUpCustomAmount.set('');
  }

  get topUpFinalAmount(): string {
    return this.topUpCustomAmount() ? `₦${Number(this.topUpCustomAmount()).toLocaleString()}` : this.topUpAmount();
  }

  topUpNext() {
    if (this.topUpStep() < 2) this.topUpStep.update((s) => s + 1);
  }

  topUpBack() {
    if (this.topUpStep() > 0) this.topUpStep.update((s) => s - 1);
  }

  onTopUpProofSelected(file: File | null) {
    this.topUpProofFile.set(file);
  }

  confirmTopUp() {
    this.topUpHistory.update((all) => [
      { date: new Date().toISOString().slice(0, 16).replace('T', ' '), reference: this.topUpReference(), amount: this.topUpFinalAmount, status: 'pending' },
      ...all,
    ]);
    this.topUpOpen.set(false);
  }

  // ── Withdrawal flow ──
  readonly withdrawalOpen = signal(false);
  readonly withdrawalAmount = signal('');
  readonly withdrawalAccount = signal('');
  readonly withdrawalReason = signal('');

  readonly withdrawalAccountOptions: SelectOption[] = [
    { value: 'gtb-0162989824', label: 'GTBank — 0162989824' },
    { value: 'access-0234567890', label: 'Access Bank — 0234567890' },
  ];

  openWithdrawal() {
    this.withdrawalAmount.set('');
    this.withdrawalAccount.set('gtb-0162989824');
    this.withdrawalReason.set('');
    this.withdrawalOpen.set(true);
  }

  closeWithdrawal() {
    this.withdrawalOpen.set(false);
  }

  get withdrawalExceedsAvailable(): boolean {
    return (Number(this.withdrawalAmount()) || 0) > this.availableBalance();
  }

  submitWithdrawal() {
    if (this.withdrawalExceedsAvailable || !this.withdrawalAmount()) return;
    this.withdrawalOpen.set(false);
  }

  // ── Auto top-up settings ──
  readonly autoTopUpOpen = signal(false);
  autoTopUpEnabled = false;
  autoTopUpThreshold = '';
  autoTopUpAmount = '';
  autoTopUpSource = 'gtb-0162989824';

  openAutoTopUp() {
    this.autoTopUpOpen.set(true);
  }

  closeAutoTopUp() {
    this.autoTopUpOpen.set(false);
  }

  saveAutoTopUp() {
    this.autoTopUpOpen.set(false);
  }
}
