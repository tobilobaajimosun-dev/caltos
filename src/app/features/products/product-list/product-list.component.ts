import { Component, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HiIconComponent, IconData } from '../../../shared/components/hi-icon/hi-icon.component';
import { LoanTypeModalComponent } from '../../loans/create-loan/loan-type-modal/loan-type-modal.component';
import { ProductSettingsModalComponent } from '../product-settings-modal/product-settings-modal.component';
import { TooltipComponent, EmptyStateComponent } from '../../../shared/components';
import {
  InformationCircleIcon,
  FilterIcon,
  MoreVerticalIcon,
  PlusSignIcon,
  FileNotFoundIcon,
} from '@hugeicons/core-free-icons';

type ProductStatus = 'live' | 'deactivated';
type ActiveTab = 'all' | 'live' | 'deactivated' | 'fees';

interface Product {
  name: string;
  productId: string;
  type?: 'loan' | 'bnpl';
  minAmount: string;
  maxAmount: string;
  minTenor: string;
  maxTenor: string;
  interestRate: string;
  status: ProductStatus;
  createdAt: string;
}

interface Fee {
  name: string;
  type: 'Flat Fee' | 'Percentage';
  flatFee: string;
  percentage: string;
  minFee: string;
  maxFee: string;
  createdAt: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, HiIconComponent, LoanTypeModalComponent, ProductSettingsModalComponent, TooltipComponent, EmptyStateComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent {
  activeTab: ActiveTab = 'all';
  showLoanTypeModal = false;
  showSettingsDrawer = false;
  openDropdownId: string | null = null;

  readonly infoIcon: IconData = InformationCircleIcon as IconData;
  readonly filterIcon: IconData = FilterIcon as IconData;
  readonly moreIcon: IconData = MoreVerticalIcon as IconData;
  readonly plusIcon: IconData = PlusSignIcon as IconData;
  readonly emptyIcon: IconData = FileNotFoundIcon as IconData;

  @HostListener('document:click')
  closeDropdown() { this.openDropdownId = null; }

  toggleDropdown(event: Event, productId: string) {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === productId ? null : productId;
  }

  readonly products: Product[] = [
    { name: 'Corper Wallet', productId: 'CW001', type: 'loan', minAmount: '30,000', maxAmount: '100,000', minTenor: '3', maxTenor: '9', interestRate: '7.5% MoM', status: 'live', createdAt: 'Aug 29, 2024, 3:52:12 PM GMT' },
    { name: 'Credit Wallet', productId: 'CRI02', type: 'loan', minAmount: '30,000', maxAmount: '100,000', minTenor: '6', maxTenor: '12', interestRate: '7.5% MoM', status: 'live', createdAt: 'Aug 29, 2024, 3:52:12 PM GMT' },
    { name: 'Credit Alert', productId: 'CA100', type: 'loan', minAmount: '30,000', maxAmount: '100,000', minTenor: '12', maxTenor: '24', interestRate: '7.5% DoD', status: 'live', createdAt: 'Aug 29, 2024, 3:52:12 PM GMT' },
    { name: 'WACS', productId: 'WCR03', type: 'loan', minAmount: '30,000', maxAmount: '100,000', minTenor: '24', maxTenor: '52', interestRate: '7.5% MoM', status: 'deactivated', createdAt: 'Aug 29, 2024, 3:52:12 PM GMT' },
    { name: 'Quick Buy BNPL', productId: 'QB001', type: 'bnpl', minAmount: '20,000', maxAmount: '500,000', minTenor: '1', maxTenor: '12', interestRate: '5.0% MoM', status: 'live', createdAt: 'Jun 12, 2025, 10:14:22 AM GMT' },
  ];

  readonly fees: Fee[] = [
    { name: 'Admin Fees', type: 'Flat Fee', flatFee: '₦2,500', percentage: '-', minFee: '-', maxFee: '-', createdAt: 'Aug 29, 2024, 3:52:12 PM GMT' },
    { name: 'Processing Fee', type: 'Percentage', flatFee: '-', percentage: '1.50%', minFee: '₦750', maxFee: '₦1550', createdAt: 'Aug 29, 2024, 3:52:12 PM GMT' },
  ];

  get stats() {
    return {
      all: this.products.length,
      live: this.products.filter(p => p.status === 'live').length,
      deactivated: this.products.filter(p => p.status === 'deactivated').length,
    };
  }

  get filteredProducts(): Product[] {
    if (this.activeTab === 'live') return this.products.filter(p => p.status === 'live');
    if (this.activeTab === 'deactivated') return this.products.filter(p => p.status === 'deactivated');
    return this.products;
  }

  get showProductTable(): boolean {
    return this.activeTab !== 'fees';
  }

  get isEmpty(): boolean {
    return this.showProductTable && this.filteredProducts.length === 0;
  }

  constructor(private router: Router) {}

  setTab(tab: ActiveTab) { this.activeTab = tab; }

  navigateTo(productId: string) {
    this.router.navigate(['/products', productId]);
  }
}
