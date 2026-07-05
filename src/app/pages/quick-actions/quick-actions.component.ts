import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, ToastComponent } from '../../shared/components';

export type LicenseType = 'Banking' | 'Microfinance' | 'Fintech' | 'Moneylender' | 'SACCO' | 'Cooperative' | 'Other';

const LICENSE_TYPE_OPTIONS: { value: LicenseType; label: string }[] = [
  { value: 'Banking', label: 'Banking' },
  { value: 'Microfinance', label: 'Microfinance' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'Moneylender', label: 'Moneylender' },
  { value: 'SACCO', label: 'SACCO (Savings and Credit Cooperative Organization)' },
  { value: 'Cooperative', label: 'Cooperative' },
  { value: 'Other', label: 'Other' },
];

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [RouterLink, FormsModule, ButtonComponent, ToastComponent],
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss'],
})
export class QuickActionsComponent {
  kycComplete = false;

  readonly orgName = 'Princeps Finance';
  readonly orgInitial = 'P';
  readonly orgAvatarColor = '#E55A2B';
  readonly userName = 'Jesulademi Ajimosun';

  readonly licenseTypeOptions = LICENSE_TYPE_OPTIONS;

  readonly orgVerified = signal(false);
  readonly showOrgModal = signal(false);
  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');

  orgDraft = {
    orgName: this.orgName,
    rcNumber: '',
    licenseType: '' as LicenseType | '',
    licenseTypeOther: '',
  };

  get orgFormValid(): boolean {
    if (!this.orgDraft.orgName.trim() || !this.orgDraft.rcNumber.trim() || !this.orgDraft.licenseType) return false;
    if (this.orgDraft.licenseType === 'Other' && !this.orgDraft.licenseTypeOther.trim()) return false;
    return true;
  }

  openOrgModal() {
    this.showOrgModal.set(true);
  }

  closeOrgModal() {
    this.showOrgModal.set(false);
  }

  submitOrgVerification() {
    if (!this.orgFormValid) return;
    this.orgVerified.set(true);
    this.showOrgModal.set(false);
    this.toastMessage.set('Organization details submitted for verification.');
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3500);
  }

  completeKyc() {
    this.kycComplete = true;
  }
}
