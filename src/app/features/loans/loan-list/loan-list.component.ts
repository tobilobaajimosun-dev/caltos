import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Download01Icon } from '@hugeicons/core-free-icons';
import {
  KpiCardComponent,
  ChartComponent,
  ChartDataPoint,
  ColumnTitleComponent,
  TableItemComponent,
  TableItemUser,
  BadgeStatus,
  ButtonComponent,
  IconData,
  RoundTabsComponent,
  Tab,
  SelectComponent,
  SelectOption,
  SearchComponent,
  CheckboxComponent,
  StatusBadgeComponent,
} from '../../../shared/components';

type LoanStatus = 'pending' | 'active' | 'overdue' | 'liquidated' | 'cancelled';
type Channel = 'IPPIS' | 'Remita' | 'Dedukt' | 'WACS' | 'Direct Debit';

interface LoanRow {
  id: string;
  customer: TableItemUser;
  product: string;
  channel: Channel;
  amount: string;
  status: LoanStatus;
  dueDate: string;
  selected?: boolean;
}

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [
    RouterLink, KpiCardComponent, ChartComponent, ColumnTitleComponent, TableItemComponent, ButtonComponent,
    RoundTabsComponent, SelectComponent, SearchComponent, CheckboxComponent, StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loan-list.component.html',
  styleUrl: './loan-list.component.scss',
})
export class LoanListComponent {
  readonly downloadIcon: IconData = Download01Icon as IconData;

  readonly disbursementTrend: ChartDataPoint[] = [
    { label: 'Mon', value: 12 }, { label: 'Tue', value: 18 }, { label: 'Wed', value: 14 },
    { label: 'Thu', value: 22 }, { label: 'Fri', value: 19 }, { label: 'Sat', value: 9 }, { label: 'Sun', value: 15 },
  ];

  readonly statusTabs: Tab[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Active', value: 'active' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Liquidated', value: 'liquidated' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  readonly activeStatus = signal('all');
  setStatus(value: string) {
    this.activeStatus.set(value);
  }

  readonly channelOptions: SelectOption[] = [
    { value: 'all', label: 'All channels' },
    { value: 'IPPIS', label: 'IPPIS' },
    { value: 'Remita', label: 'Remita' },
    { value: 'Dedukt', label: 'Dedukt' },
    { value: 'WACS', label: 'WACS' },
    { value: 'Direct Debit', label: 'Direct Debit' },
  ];
  readonly channelFilter = signal('all');

  readonly bucketOptions: SelectOption[] = [
    { value: 'all', label: 'All overdue buckets' },
    { value: '1-30', label: '1–30 days' },
    { value: '31-60', label: '31–60 days' },
    { value: '61-90', label: '61–90 days' },
    { value: '90+', label: '90+ days' },
  ];
  readonly bucketFilter = signal('all');

  readonly searchQuery = signal('');

  readonly loans = signal<LoanRow[]>([
    { id: 'LN-202406-001', customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, product: 'Salary Advance', channel: 'Remita', amount: '₦150,000', status: 'active', dueDate: '2026-07-30' },
    { id: 'LN-202406-002', customer: { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' }, product: 'Corper Wallet', channel: 'IPPIS', amount: '₦75,000', status: 'pending', dueDate: '2026-08-02' },
    { id: 'LN-202406-003', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, product: 'Credit Wallet', channel: 'Dedukt', amount: '₦320,000', status: 'overdue', dueDate: '2026-06-18' },
    { id: 'LN-202406-004', customer: { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' }, product: 'Credit Lite', channel: 'WACS', amount: '₦45,000', status: 'active', dueDate: '2026-07-25' },
    { id: 'LN-202406-005', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, product: 'Salary Advance', channel: 'Direct Debit', amount: '₦210,000', status: 'overdue', dueDate: '2026-07-10' },
    { id: 'LN-202406-006', customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, product: 'Salary Advance', channel: 'Remita', amount: '₦95,000', status: 'liquidated', dueDate: '2026-05-15' },
    { id: 'LN-202406-007', customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, product: 'Corper Wallet', channel: 'IPPIS', amount: '₦60,000', status: 'cancelled', dueDate: '2026-06-01' },
  ]);

  readonly productTabs = computed(() => ['All Products', ...new Set(this.loans().map((l) => l.product))]);
  activeProduct = 'All Products';

  setProduct(product: string) {
    this.activeProduct = product;
  }

  get filteredLoans(): LoanRow[] {
    let list = this.loans();

    if (this.activeStatus() !== 'all') list = list.filter((l) => l.status === this.activeStatus());
    if (this.activeProduct !== 'All Products') list = list.filter((l) => l.product === this.activeProduct);
    if (this.channelFilter() !== 'all') list = list.filter((l) => l.channel === this.channelFilter());

    if (this.bucketFilter() !== 'all') {
      const days = (l: LoanRow) => Math.max(0, Math.round((Date.now() - new Date(l.dueDate).getTime()) / 86_400_000));
      list = list.filter((l) => {
        if (l.status !== 'overdue') return false;
        const d = days(l);
        if (this.bucketFilter() === '1-30') return d <= 30;
        if (this.bucketFilter() === '31-60') return d > 30 && d <= 60;
        if (this.bucketFilter() === '61-90') return d > 60 && d <= 90;
        return d > 90;
      });
    }

    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter((l) =>
        l.id.toLowerCase().includes(q) ||
        l.customer.name.toLowerCase().includes(q) ||
        l.product.toLowerCase().includes(q),
      );
    }

    return list;
  }

  readonly anySelected = computed(() => this.loans().some((l) => l.selected));
  readonly selectedCount = computed(() => this.loans().filter((l) => l.selected).length);

  toggleSelect(loan: LoanRow, checked: boolean) {
    this.loans.update((all) => all.map((l) => (l.id === loan.id ? { ...l, selected: checked } : l)));
  }

  clearSelection() {
    this.loans.update((all) => all.map((l) => ({ ...l, selected: false })));
  }

  statusBadge(status: LoanStatus): { status: BadgeStatus; label: string } {
    switch (status) {
      case 'pending': return { status: 'pending', label: 'Pending' };
      case 'active': return { status: 'active', label: 'Active' };
      case 'overdue': return { status: 'overdue', label: 'Overdue' };
      case 'liquidated': return { status: 'successful', label: 'Liquidated' };
      case 'cancelled': return { status: 'inactive', label: 'Cancelled' };
    }
  }

  bulkExport() {
    const selected = this.loans().filter((l) => l.selected);
    const header = 'Loan ID,Customer,Product,Channel,Amount,Status,Due Date\n';
    const body = selected.map((l) => `${l.id},${l.customer.name},${l.product},${l.channel},${l.amount},${l.status},${l.dueDate}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loans-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.clearSelection();
  }

  bulkAssignOfficer() {
    this.clearSelection();
  }

  exportAll() {
    const header = 'Loan ID,Customer,Product,Channel,Amount,Status,Due Date\n';
    const body = this.filteredLoans.map((l) => `${l.id},${l.customer.name},${l.product},${l.channel},${l.amount},${l.status},${l.dueDate}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loans-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
