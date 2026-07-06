import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
  DrawerComponent,
  SelectComponent,
  SelectOption,
  InputComponent,
  ButtonComponent,
  CheckboxComponent,
} from '../../../shared/components';

type Channel = 'IPPIS' | 'Remita' | 'Dedukt' | 'WACS' | 'Direct Debit';
type RefundStatus = 'pending' | 'posted' | 'failed';

interface OverDeductionRow {
  loanId: string;
  customer: { name: string; email: string };
  channel: Channel;
  expected: number;
  collected: number;
  selected?: boolean;
}

interface RefundLogRow {
  refundId: string;
  loanId: string;
  amount: string;
  status: RefundStatus;
  initiatedBy: string;
  date: string;
}

interface MonthlyRefundRow {
  channel: Channel;
  value: number;
  volume: number;
}

@Component({
  selector: 'app-refunds',
  standalone: true,
  imports: [
    DecimalPipe,
    KpiCardComponent,
    ColumnTitleComponent,
    TableItemComponent,
    StatusBadgeComponent,
    RoundTabsComponent,
    DrawerComponent,
    SelectComponent,
    InputComponent,
    ButtonComponent,
    CheckboxComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './refunds.component.html',
  styleUrl: './refunds.component.scss',
})
export class RefundsComponent {
  private readonly route = inject(ActivatedRoute);
  readonly loanId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly tabs: Tab[] = [
    { label: 'Over-deduction queue', value: 'queue' },
    { label: 'Refund log', value: 'log' },
    { label: 'Monthly report', value: 'report' },
  ];

  readonly activeTab = signal('queue');
  setTab(value: string) {
    this.activeTab.set(value);
  }

  readonly paymentMethods: SelectOption[] = [
    { value: 'wallet-credit', label: 'Wallet credit' },
    { value: 'bank-transfer', label: 'Bank transfer' },
    { value: 'loan-credit', label: 'Credit to loan balance' },
  ];

  readonly overDeductions = signal<OverDeductionRow[]>([
    { loanId: this.loanId || 'LN-88213', customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, channel: 'IPPIS', expected: 25_000, collected: 33_000 },
    { loanId: 'LN-88214', customer: { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' }, channel: 'Remita', expected: 120_000, collected: 145_000 },
    { loanId: 'LN-88215', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, channel: 'Dedukt', expected: 2_500_750, collected: 2_580_750 },
  ]);

  readonly anySelected = computed(() => this.overDeductions().some((r) => r.selected));
  readonly selectedTotal = computed(() =>
    this.overDeductions().filter((r) => r.selected).reduce((sum, r) => sum + (r.collected - r.expected), 0));

  toggleSelect(row: OverDeductionRow, checked: boolean) {
    this.overDeductions.update((all) => all.map((r) => (r.loanId === row.loanId ? { ...r, selected: checked } : r)));
  }

  overAmount(row: OverDeductionRow): number {
    return row.collected - row.expected;
  }

  readonly refundLog = signal<RefundLogRow[]>([
    { refundId: 'RF-1183', loanId: 'LN-88190', amount: '₦8,000', status: 'posted', initiatedBy: 'B. Nwachukwu', date: '2026-06-29' },
    { refundId: 'RF-1184', loanId: 'LN-88104', amount: '₦15,500', status: 'pending', initiatedBy: 'T. Adeyemi', date: '2026-07-02' },
    { refundId: 'RF-1185', loanId: 'LN-88077', amount: '₦3,200', status: 'failed', initiatedBy: 'K. Suleiman', date: '2026-07-03' },
  ]);

  refundStatusBadge(status: RefundStatus): { status: BadgeStatus; label: string } {
    switch (status) {
      case 'pending': return { status: 'pending', label: 'Pending' };
      case 'posted': return { status: 'successful', label: 'Posted' };
      case 'failed': return { status: 'failed', label: 'Failed' };
    }
  }

  readonly monthlyReport: MonthlyRefundRow[] = [
    { channel: 'IPPIS', value: 62_000, volume: 4 },
    { channel: 'Remita', value: 145_000, volume: 7 },
    { channel: 'Dedukt', value: 38_500, volume: 3 },
    { channel: 'WACS', value: 21_000, volume: 2 },
  ];

  readonly reviewing = signal<OverDeductionRow | null>(null);
  readonly refundAmount = signal(0);
  readonly paymentMethod = signal('wallet-credit');

  review(row: OverDeductionRow) {
    this.refundAmount.set(this.overAmount(row));
    this.paymentMethod.set('wallet-credit');
    this.reviewing.set(row);
  }

  closeReview() {
    this.reviewing.set(null);
  }

  approveRefund(row: OverDeductionRow) {
    const method = this.paymentMethods.find((m) => m.value === this.paymentMethod())?.label ?? '';
    this.refundLog.update((all) => [
      { refundId: `RF-${1186 + all.length}`, loanId: row.loanId, amount: `₦${this.refundAmount().toLocaleString()}`, status: 'posted', initiatedBy: 'You', date: new Date().toISOString().slice(0, 10) },
      ...all,
    ]);
    this.overDeductions.update((all) => all.filter((r) => r.loanId !== row.loanId));
    this.reviewing.set(null);
  }

  processBatch() {
    const selectedRows = this.overDeductions().filter((r) => r.selected);
    const entries = selectedRows.map((row, i) => ({
      refundId: `RF-${1186 + this.refundLog().length + i}`,
      loanId: row.loanId,
      amount: `₦${this.overAmount(row).toLocaleString()}`,
      status: 'posted' as RefundStatus,
      initiatedBy: 'You (batch)',
      date: new Date().toISOString().slice(0, 10),
    }));
    this.refundLog.update((all) => [...entries, ...all]);
    this.overDeductions.update((all) => all.filter((r) => !r.selected));
  }
}
