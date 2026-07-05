import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserAdd01Icon, FileUploadIcon } from '@hugeicons/core-free-icons';
import {
  ButtonComponent, ColumnTitleComponent, TableItemComponent, TableItemUser,
  EmptyStateComponent, PaginationComponent, SearchComponent, ConfirmModalComponent, ToastComponent,
  SelectComponent, SelectOption, SplitButtonComponent, SplitButtonItem, IconData,
} from '../../../shared/components';
import { CustomersService, CustomerRecord, CustomerStatus } from '../../../shared/services/customers.service';
import { AddEditCustomerModalComponent } from '../add-edit-customer-modal/add-edit-customer-modal.component';

type SortKey = 'name' | 'registeredAt' | 'activeLoans' | 'outstandingBalance';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    RouterLink, ButtonComponent, ColumnTitleComponent, TableItemComponent, EmptyStateComponent,
    PaginationComponent, SearchComponent, ConfirmModalComponent, ToastComponent, AddEditCustomerModalComponent,
    SelectComponent, SplitButtonComponent,
  ],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
  host: { '(document:click)': 'closeDropdown()' },
})
export class CustomerListComponent {
  private readonly customersService = inject(CustomersService);
  private readonly router = inject(Router);

  readonly customers = this.customersService.customers;

  searchQuery = '';
  statusFilter = '';
  officerFilter = '';
  productFilter = '';
  sortKey: SortKey = 'name';

  currentPage = 1;
  pageSize = 10;

  selectedIds = new Set<string>();
  openDropdownId: string | null = null;
  showAddModal = false;
  editingCustomer: CustomerRecord | null = null;

  confirmTarget: CustomerRecord | null = null;
  confirmAction: 'blacklist' | 'reactivate' | 'delete' | null = null;

  toastVisible = false;
  toastMessage = '';

  get officers(): string[] {
    return [...new Set(this.customers().map((c) => c.loanOfficer))].sort();
  }

  get products(): string[] {
    return [...new Set(this.customers().map((c) => c.product).filter((p) => p !== '—'))].sort();
  }

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'blacklisted', label: 'Blacklisted' },
    { value: 'inactive', label: 'Inactive' },
  ];

  get officerOptions(): SelectOption[] {
    return [{ value: '', label: 'All loan officers' }, ...this.officers.map((o) => ({ value: o, label: o }))];
  }

  get productOptions(): SelectOption[] {
    return [{ value: '', label: 'All products' }, ...this.products.map((p) => ({ value: p, label: p }))];
  }

  readonly addCustomerMenuItems: SplitButtonItem[] = [
    { id: 'single', label: 'Add single customer', icon: UserAdd01Icon as IconData },
    { id: 'bulk', label: 'Bulk upload via spreadsheet', icon: FileUploadIcon as IconData },
  ];

  readonly sortOptions: SelectOption[] = [
    { value: 'name', label: 'Sort: Name' },
    { value: 'registeredAt', label: 'Sort: Date Added' },
    { value: 'activeLoans', label: 'Sort: Loan Count' },
    { value: 'outstandingBalance', label: 'Sort: Outstanding Balance' },
  ];

  get stats() {
    const all = this.customers();
    return {
      total: all.length,
      active: all.filter((c) => c.status === 'active').length,
      overdue: all.filter((c) => c.status === 'overdue').length,
      blacklisted: all.filter((c) => c.status === 'blacklisted').length,
    };
  }

  get activeFilterChips(): { key: string; label: string }[] {
    const chips: { key: string; label: string }[] = [];
    if (this.statusFilter) chips.push({ key: 'status', label: `Status: ${this.statusLabel(this.statusFilter as CustomerStatus)}` });
    if (this.officerFilter) chips.push({ key: 'officer', label: `Officer: ${this.officerFilter}` });
    if (this.productFilter) chips.push({ key: 'product', label: `Product: ${this.productFilter}` });
    return chips;
  }

  removeFilterChip(key: string) {
    if (key === 'status') this.statusFilter = '';
    if (key === 'officer') this.officerFilter = '';
    if (key === 'product') this.productFilter = '';
    this.currentPage = 1;
  }

  get filteredCustomers(): CustomerRecord[] {
    let list = this.customers();

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.bvn.includes(q));
    }
    if (this.statusFilter) list = list.filter((c) => c.status === this.statusFilter);
    if (this.officerFilter) list = list.filter((c) => c.loanOfficer === this.officerFilter);
    if (this.productFilter) list = list.filter((c) => c.product === this.productFilter);

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

  closeDropdown() { this.openDropdownId = null; }

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
