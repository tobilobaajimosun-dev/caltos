import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent, CopyUrlFieldComponent } from '../../../shared/components';

type DetailTab = 'overview' | 'activity' | 'integrations';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, SidebarComponent, CopyUrlFieldComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent {
  activeTab: DetailTab = 'overview';

  readonly product = {
    name: 'Corper Wallet',
    status: 'live' as const,
    createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
    description: 'This loan is for National Youth Service Corps members',
    websiteLink: 'https://saas.product.com/7pzY',
    minAmount: '20,000',
    maxAmount: '100,000',
    minTenor: '3',
    maxTenor: '12',
    minRate: '1.5',
    maxRate: '7.5',
    hasFees: true,
    hasDocuments: true,
  };

  checklist: ChecklistItem[] = [
    { id: 'basic', label: 'Basic configuration', description: 'Amounts, tenor, and interest rate set', done: true },
    { id: 'fees', label: 'Fees attached', description: 'At least one fee is linked to this product', done: true },
    { id: 'documents', label: 'Required documents listed', description: 'Borrowers know what to upload', done: true },
    { id: 'eligibility', label: 'Eligibility criteria defined', description: 'Rules for who qualifies for this product', done: false },
    { id: 'approval', label: 'Approval workflow assigned', description: 'At least one approver is required', done: false },
    { id: 'portal', label: 'Borrower portal enabled', description: 'Product is accessible on the public portal', done: true },
  ];

  get completedCount() {
    return this.checklist.filter(c => c.done).length;
  }

  get isFullySetup() {
    return this.completedCount === this.checklist.length;
  }

  setTab(tab: DetailTab) {
    this.activeTab = tab;
  }
}
