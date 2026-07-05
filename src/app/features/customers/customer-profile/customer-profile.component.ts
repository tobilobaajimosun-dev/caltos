import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbComponent, ButtonComponent, ConfirmModalComponent, ToastComponent } from '../../../shared/components';
import { CustomersService, CustomerRecord } from '../../../shared/services/customers.service';
import { AddEditCustomerModalComponent } from '../add-edit-customer-modal/add-edit-customer-modal.component';

type ProfileTab = 'overview' | 'loans' | 'kyc' | 'repayments' | 'notes' | 'activity';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [FormsModule, BreadcrumbComponent, ButtonComponent, ConfirmModalComponent, ToastComponent, AddEditCustomerModalComponent],
  templateUrl: './customer-profile.component.html',
  styleUrl: './customer-profile.component.scss',
})
export class CustomerProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customersService = inject(CustomersService);

  customer: CustomerRecord | null = null;
  activeTab: ProfileTab = 'overview';
  expandedLoanId: string | null = null;

  showEditModal = false;
  confirmAction: 'suspend' | 'reactivate' | null = null;

  newNote = '';

  toastVisible = false;
  toastMessage = '';

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = params['id'] as string;
      this.customer = this.customersService.getById(id) ?? null;
      this.activeTab = 'overview';
    });
  }

  setTab(tab: ProfileTab) { this.activeTab = tab; }

  toggleLoanExpand(id: string) {
    this.expandedLoanId = this.expandedLoanId === id ? null : id;
  }

  openEdit() { this.showEditModal = true; }

  onCustomerSaved(updated: CustomerRecord) {
    this.customer = updated;
    this.showEditModal = false;
  }

  requestSuspendToggle() {
    if (!this.customer) return;
    this.confirmAction = this.customer.status === 'blacklisted' ? 'reactivate' : 'suspend';
  }

  confirmSuspendExecute() {
    if (!this.customer || !this.confirmAction) return;
    const nextStatus = this.confirmAction === 'suspend' ? 'blacklisted' : 'active';
    this.customersService.setStatus(this.customer.id, nextStatus);
    this.customer = { ...this.customer, status: nextStatus };
    this.showToast(this.confirmAction === 'suspend' ? 'Customer suspended.' : 'Customer reactivated.');
    this.confirmAction = null;
  }

  cancelSuspend() {
    this.confirmAction = null;
  }

  get confirmCopy() {
    const name = this.customer?.name ?? 'this customer';
    if (this.confirmAction === 'suspend') {
      return { title: 'Suspend customer?', message: `${name} will be blocked from applying for new loans until reactivated.`, confirmLabel: 'Suspend', danger: true };
    }
    return { title: 'Reactivate customer?', message: `${name} will be able to apply for loans again.`, confirmLabel: 'Reactivate', danger: false };
  }

  addNote() {
    if (!this.customer || !this.newNote.trim()) return;
    this.customersService.addNote(this.customer.id, 'You', this.newNote.trim());
    this.customer = this.customersService.getById(this.customer.id) ?? this.customer;
    this.newNote = '';
    this.showToast('Note added.');
  }

  statusLabel(status: string): string {
    if (status === 'active') return 'Active';
    if (status === 'overdue') return 'Overdue';
    if (status === 'blacklisted') return 'Blacklisted';
    return 'Inactive';
  }

  private showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 3000);
  }
}
