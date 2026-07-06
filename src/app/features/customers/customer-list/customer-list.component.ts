import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserAdd01Icon, FileUploadIcon, FilterIcon, ColumnsThreeCogIcon, Download01Icon } from '@hugeicons/core-free-icons';
import {
  ButtonComponent, ColumnTitleComponent, TableItemComponent, TableItemUser,
  EmptyStateComponent, PaginationComponent, ConfirmModalComponent, ToastComponent,
  SplitButtonComponent, SplitButtonItem, IconData, HiIconComponent, Tab, RoundTabsComponent,
  SearchComponent, SelectComponent, SelectOption, KpiCardComponent,
} from '../../../shared/components';
import { CustomersService, CustomerRecord, CustomerStatus } from '../../../shared/services/customers.service';
import { AddEditCustomerModalComponent } from '../add-edit-customer-modal/add-edit-customer-modal.component';

type SortKey = 'name' | 'registeredAt' | 'activeLoans' | 'outstandingBalance';
type CustomerTab = 'all' | 'active' | 'dormant' | 'overdue';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    RouterLink, ButtonComponent, ColumnTitleComponent, TableItemComponent, EmptyStateComponent,
    PaginationComponent, ConfirmModalComponent, ToastComponent, AddEditCustomerModalComponent,
    SplitButtonComponent, HiIconComponent, RoundTabsComponent, SearchComponent, SelectComponent,
    KpiCardComponent,
  ],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
  host: { '(document:click)': 'closeDropdown()' },
})
export class CustomerListComponent {
  private readonly customersService = inject(CustomersService);
  private readonly router = inject(Router);

  readonly customers = this.customersService.customers;

  readonly filterIcon: IconData = FilterIcon as IconData;
  readonly columnsIcon: IconData = ColumnsThreeCogIcon as IconData;
  readonly downloadIcon: IconData = Download01Icon as IconData;

  activeTab: CustomerTab = 'all';
  sortKey: SortKey = 'name';

  readonly tabs: Tab[] = [
    { label: 'All Customers', value: 'all' },
    { label: 'Active Customers', value: 'active' },
    { label: 'Dormant Customers', value: 'dormant' },
    { label: 'Overdue Customers', value: 'overdue' },
  ];

  currentPage = 1;
  pageSize = 10;

  selectedIds = new Set<string>();
  openDropdownId: string | null = null;
  showAddModal = false;
  editingCustomer: CustomerRecord | null = null;

  searchQuery = '';
  filterPanelOpen = false;
  officerFilter = 'all';
  productFilter = 'all';
  locationFilter = 'all';

  readonly sortOptions: SelectOption[] = [
    { value: 'name', label: 'Name' },
    { value: 'registeredAt', label: 'Date Added' },
    { value: 'activeLoans', label: 'Loan Count' },
    { value: 'outstandingBalance', label: 'Outstanding Balance' },
  ];

  get officerOptions(): SelectOption[] {
    const officers = Array.from(new Set(this.customers().map((c) => c.loanOfficer)));
    return [{ value: 'all', label: 'All loan officers' }, ...officers.map((o) => ({ value: o, label: o }))];
  }

  get productOptions(): SelectOption[] {
    const products = Array.from(new Set(this.customers().map((c) => c.product)));
    return [{ value: 'all', label: 'All products' }, ...products.map((p) => ({ value: p, label: p }))];
  }

  get locationOptions(): SelectOption[] {
    const locations = Array.from(new Set(this.customers().map((c) => c.location)));
    return [{ value: 'all', label: 'All locations' }, ...locations.map((l) => ({ value: l, label: l }))];
  }

  get activeFilterChips(): { key: string; label: string }[] {
    const chips: { key: string; label: string }[] = [];
    if (this.officerFilter !== 'all') chips.push({ key: 'officer', label: `Officer: ${this.officerFilter}` });
    if (this.productFilter !== 'all') chips.push({ key: 'product', label: `Product: ${this.productFilter}` });
    if (this.locationFilter !== 'all') chips.push({ key: 'location', label: `Location: ${this.locationFilter}` });
    return chips;
  }

  removeFilterChip(key: string) {
    if (key === 'officer') this.officerFilter = 'all';
    if (key === 'product') this.productFilter = 'all';
    if (key === 'location') this.locationFilter = 'all';
    this.currentPage = 1;
  }

  toggleFilterPanel() {
    this.filterPanelOpen = !this.filterPanelOpen;
  }

  onSearchChange(value: string) {
    this.searchQuery = value;
    this.currentPage = 1;
  }

  confirmTarget: CustomerRecord | null = null;
  confirmAction: 'blacklist' | 'reactivate' | 'delete' | null = null;

  toastVisible = false;
  toastMessage = '';

  readonly addCustomerMenuItems: SplitButtonItem[] = [
    { id: 'single', label: 'Add single customer', icon: UserAdd01Icon as IconData },
    { id: 'bulk', label: 'Bulk upload via spreadsheet', icon: FileUploadIcon as IconData },
  ];

  get stats() {
    const all = this.customers();
    return {
      total: all.length,
      active: all.filter((c) => c.status === 'active').length,
      overdue: all.filter((c) => c.status === 'overdue').length,
      dormant: all.filter((c) => c.status === 'inactive').length,
    };
  }

  setTab(tab: CustomerTab) {
    this.activeTab = tab;
    this.currentPage = 1;
  }

  get filteredCustomers(): CustomerRecord[] {
    let list = this.customers();

    if (this.activeTab === 'active') list = list.filter((c) => c.status === 'active');
    if (this.activeTab === 'dormant') list = list.filter((c) => c.status === 'inactive');
    if (this.activeTab === 'overdue') list = list.filter((c) => c.status === 'overdue');

    if (this.officerFilter !== 'all') list = list.filter((c) => c.loanOfficer === this.officerFilter);
    if (this.productFilter !== 'all') list = list.filter((c) => c.product === this.productFilter);
    if (this.locationFilter !== 'all') list = list.filter((c) => c.location === this.locationFilter);

    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, '')) ||
        c.bvn.includes(query),
      );
    }

    list = [...list].sort((a, b) => {
      if (this.sortKey === 'name') return a.name.localeCompare(b.name);
      if (this.sortKey === 'registeredAt') return b.registeredAt.localeCompare(a.registeredAt);
      if (this.sortKey === 'activeLoans') return b.activeLoans - a.activeLoans;
      return this.parseAmount(b.outstandingBalance) - this.parseAmount(a.outstandingBalance);
    });

    return list;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCustomers.length / this.pageSize));
  }

  get pagedCustomers(): CustomerRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCustomers.slice(start, start + this.pageSize);
  }

  get isEmpty(): boolean {
    return this.filteredCustomers.length === 0;
  }

  get allPageSelected(): boolean {
    return this.pagedCustomers.length > 0 && this.pagedCustomers.every((c) => this.selectedIds.has(c.id));
  }

  private parseAmount(value: string): number {
    return Number(value.replace(/[^\d.]/g, '')) || 0;
  }

  maskedPhone(phone: string): string {
    if (phone.length < 7) return phone;
    return `${phone.slice(0, 4)} *** *${phone.slice(-3)}`;
  }

  asUser(c: CustomerRecord): TableItemUser {
    return { name: c.name, email: c.email };
  }

  statusLabel(status: CustomerStatus): string {
    if (status === 'active') return 'Active';
    if (status === 'overdue') return 'Overdue';
    if (status === 'blacklisted') return 'Blacklisted';
    return 'Inactive';
  }

  relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  toggleSelectAll() {
    if (this.allPageSelected) {
      this.pagedCustomers.forEach((c) => this.selectedIds.delete(c.id));
    } else {
      this.pagedCustomers.forEach((c) => this.selectedIds.add(c.id));
    }
  }

  toggleSelect(id: string) {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
  }

  clearSelection() {
    this.selectedIds.clear();
  }

  navigateTo(id: string) {
    this.router.navigate(['/customers', id]);
  }

  closeDropdown() { this.openDropdownId = null; this.filterPanelOpen = false; }

  toggleDropdown(event: Event, id: string) {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  openAddCustomer() {
    this.editingCustomer = null;
    this.showAddModal = true;
  }

  onAddCustomerMenuSelect(id: string) {
    if (id === 'single') this.openAddCustomer();
    if (id === 'bulk') this.showToast('Bulk upload via spreadsheet is coming soon.');
  }

  openEditCustomer(event: Event, customer: CustomerRecord) {
    event.stopPropagation();
    this.openDropdownId = null;
    this.editingCustomer = customer;
    this.showAddModal = true;
  }

  requestBlacklist(event: Event, customer: CustomerRecord) {
    event.stopPropagation();
    this.openDropdownId = null;
    this.confirmTarget = customer;
    this.confirmAction = customer.status === 'blacklisted' ? 'reactivate' : 'blacklist';
  }

  requestDelete(event: Event, customer: CustomerRecord) {
    event.stopPropagation();
    this.openDropdownId = null;
    this.confirmTarget = customer;
    this.confirmAction = 'delete';
  }

  confirmActionExecute() {
    if (!this.confirmTarget || !this.confirmAction) return;
    const customer = this.confirmTarget;
    if (this.confirmAction === 'blacklist') {
      this.customersService.setStatus(customer.id, 'blacklisted');
      this.showToast(`${customer.name} has been blacklisted.`);
    } else if (this.confirmAction === 'reactivate') {
      this.customersService.setStatus(customer.id, 'active');
      this.showToast(`${customer.name} has been reactivated.`);
    } else if (this.confirmAction === 'delete') {
      this.customersService.remove(customer.id);
      this.showToast(`${customer.name} has been removed.`);
    }
    this.cancelConfirm();
  }

  cancelConfirm() {
    this.confirmTarget = null;
    this.confirmAction = null;
  }

  get confirmModalCopy() {
    const name = this.confirmTarget?.name ?? 'this customer';
    switch (this.confirmAction) {
      case 'blacklist': return { title: 'Blacklist customer?', message: `${name} will be blocked from applying for new loans. This can be reversed later.`, confirmLabel: 'Blacklist', danger: true };
      case 'reactivate': return { title: 'Reactivate customer?', message: `${name} will be able to apply for loans again.`, confirmLabel: 'Reactivate', danger: false };
      case 'delete': return { title: 'Remove customer?', message: `This permanently removes ${name} from your records. This cannot be undone.`, confirmLabel: 'Remove', danger: true };
      default: return { title: '', message: '', confirmLabel: 'Confirm', danger: false };
    }
  }

  bulkExport() {
    this.showToast(`Exported ${this.selectedIds.size} customer${this.selectedIds.size === 1 ? '' : 's'}.`);
    this.clearSelection();
  }

  exportAll() {
    this.showToast(`Exported ${this.filteredCustomers.length} customer${this.filteredCustomers.length === 1 ? '' : 's'}.`);
  }

  editColumns() {
    this.showToast('Column customization is coming soon.');
  }

  bulkSendReminder() {
    this.showToast(`Reminder sent to ${this.selectedIds.size} customer${this.selectedIds.size === 1 ? '' : 's'}.`);
    this.clearSelection();
  }

  bulkAssignOfficer() {
    this.showToast(`Assigned ${this.selectedIds.size} customer${this.selectedIds.size === 1 ? '' : 's'} to a loan officer.`);
    this.clearSelection();
  }

  private showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 3000);
  }
}
