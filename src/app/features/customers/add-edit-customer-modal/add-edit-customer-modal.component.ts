import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components';
import { CustomersService, CustomerRecord } from '../../../shared/services/customers.service';

interface DraftCustomer {
  name: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  location: string;
  employer: string;
  salary: string;
  bankName: string;
  accountNumber: string;
  bvn: string;
}

const STEPS = ['Personal Info', 'Employment', 'Bank Account', 'KYC'];

@Component({
  selector: 'app-add-edit-customer-modal',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './add-edit-customer-modal.component.html',
  styleUrl: './add-edit-customer-modal.component.scss',
})
export class AddEditCustomerModalComponent implements OnChanges {
  private readonly customersService = inject(CustomersService);

  @Input() isOpen = false;
  @Input() customer: CustomerRecord | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<CustomerRecord>();

  readonly steps = STEPS;
  step = 0;

  draft: DraftCustomer = this.emptyDraft();

  readonly bvnLookupState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly bvnLookupName = signal('');

  private emptyDraft(): DraftCustomer {
    return { name: '', email: '', phone: '', dob: '', address: '', location: '', employer: '', salary: '', bankName: '', accountNumber: '', bvn: '' };
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.step = 0;
      this.bvnLookupState.set('idle');
      this.bvnLookupName.set('');
      this.draft = this.customer
        ? {
            name: this.customer.name, email: this.customer.email, phone: this.customer.phone,
            dob: this.customer.dob, address: this.customer.address, location: this.customer.location,
            employer: this.customer.employer, salary: this.customer.salary,
            bankName: this.customer.linkedAccounts[0]?.bank ?? '', accountNumber: this.customer.linkedAccounts[0]?.accountNumber ?? '',
            bvn: this.customer.bvn,
          }
        : this.emptyDraft();
    }
  }

  get isEditMode(): boolean {
    return !!this.customer;
  }

  get isLastStep(): boolean {
    return this.step === this.steps.length - 1;
  }

  next() { if (!this.isLastStep) this.step++; }
  back() { if (this.step > 0) this.step--; }

  close() {
    this.closed.emit();
  }

  lookupBvn() {
    if (this.draft.bvn.length !== 11) return;
    this.bvnLookupState.set('loading');
    this.bvnLookupName.set('');
    setTimeout(() => {
      if (this.draft.bvn.startsWith('0')) {
        this.bvnLookupState.set('error');
      } else {
        this.bvnLookupState.set('success');
        this.bvnLookupName.set(this.draft.name || 'CUSTOMER NAME ON RECORD');
      }
    }, 1200);
  }

  submit() {
    const patch: Partial<CustomerRecord> & { name: string } = {
      name: this.draft.name,
      email: this.draft.email,
      phone: this.draft.phone,
      dob: this.draft.dob,
      address: this.draft.address,
      location: this.draft.location,
      employer: this.draft.employer,
      salary: this.draft.salary,
      linkedAccounts: this.draft.bankName ? [{ bank: this.draft.bankName, accountNumber: this.draft.accountNumber }] : [],
      bvn: this.draft.bvn,
      bvnStatus: this.bvnLookupState() === 'success' ? 'verified' : 'pending',
    };

    const record = this.isEditMode
      ? (this.customersService.update(this.customer!.id, patch), this.customersService.getById(this.customer!.id)!)
      : this.customersService.create(patch);

    this.saved.emit(record);
    this.close();
  }
}
