import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HiIconComponent, IconData } from '../../../shared/components/hi-icon/hi-icon.component';
import { LoanTypeModalComponent } from '../../loans/create-loan/loan-type-modal/loan-type-modal.component';
import { ProductSettingsModalComponent } from '../product-settings-modal/product-settings-modal.component';
import { TooltipComponent, EmptyStateComponent, ButtonComponent, ConfirmModalComponent, ToastComponent, SearchComponent } from '../../../shared/components';
import { ProductsService, ProductRecord, ProductStatus } from '../../../shared/services/products.service';
import {
  InformationCircleIcon,
  FilterIcon,
  MoreVerticalIcon,
  PlusSignIcon,
  FileNotFoundIcon,
} from '@hugeicons/core-free-icons';

type ActiveTab = 'all' | 'live' | 'draft' | 'deactivated' | 'fees';

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
  imports: [
    RouterLink, HiIconComponent, LoanTypeModalComponent, ProductSettingsModalComponent,
    TooltipComponent, EmptyStateComponent, ButtonComponent, ConfirmModalComponent, ToastComponent, SearchComponent,
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  host: { '(document:click)': 'closeDropdown()' },
})
export class ProductListComponent {
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);

  activeTab: ActiveTab = 'all';
  searchQuery = '';
  showLoanTypeModal = false;
  showSettingsDrawer = false;
  openDropdownId: string | null = null;

  readonly infoIcon: IconData = InformationCircleIcon as IconData;
  readonly filterIcon: IconData = FilterIcon as IconData;
  readonly moreIcon: IconData = MoreVerticalIcon as IconData;
  readonly plusIcon: IconData = PlusSignIcon as IconData;
  readonly emptyIcon: IconData = FileNotFoundIcon as IconData;

  readonly products = this.productsService.products;

  // Confirmation modal state
  confirmTarget: ProductRecord | null = null;
  confirmAction: 'deactivate' | 'activate' | 'delete' | null = null;

  // Toast feedback
  toastVisible = false;
  toastMessage = '';

  readonly fees: Fee[] = [
    { name: 'Admin Fees', type: 'Flat Fee', flatFee: '₦2,500', percentage: '-', minFee: '-', maxFee: '-', createdAt: 'Aug 29, 2024, 3:52:12 PM GMT' },
    { name: 'Processing Fee', type: 'Percentage', flatFee: '-', percentage: '1.50%', minFee: '₦750', maxFee: '₦1550', createdAt: 'Aug 29, 2024, 3:52:12 PM GMT' },
  ];

  get stats() {
    const all = this.products();
    return {
      all: all.length,
      live: all.filter((p) => p.status === 'live').length,
      draft: all.filter((p) => p.status === 'draft').length,
      deactivated: all.filter((p) => p.status === 'deactivated').length,
    };
  }

  get filteredProducts(): ProductRecord[] {
    let list = this.products();
    if (this.activeTab === 'live') list = list.filter((p) => p.status === 'live');
    else if (this.activeTab === 'draft') list = list.filter((p) => p.status === 'draft');
    else if (this.activeTab === 'deactivated') list = list.filter((p) => p.status === 'deactivated');

    const q = this.searchQuery.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    return list;
  }

  get showProductGrid(): boolean {
    return this.activeTab !== 'fees';
  }

  get isEmpty(): boolean {
    return this.showProductGrid && this.filteredProducts.length === 0;
  }

  get emptyStateTitle(): string {
    if (this.searchQuery.trim()) return `No products match "${this.searchQuery.trim()}"`;
    if (this.activeTab === 'live') return 'No live products yet.';
    if (this.activeTab === 'draft') return 'No draft products.';
    if (this.activeTab === 'deactivated') return 'No deactivated products.';
    return 'No loan products yet.';
  }

  get emptyStateDesc(): string {
    if (this.searchQuery.trim()) return 'Try a different name or product ID.';
    return 'Launch your first product and start disbursing in minutes.';
  }

  setTab(tab: ActiveTab) { this.activeTab = tab; }

  navigateTo(id: string) {
    this.router.navigate(['/products', id]);
  }

  editProduct(product: ProductRecord) {
    this.router.navigate(['/products/create'], { queryParams: { id: product.id } });
  }

  closeDropdown() { this.openDropdownId = null; }

  toggleDropdown(event: Event, productId: string) {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === productId ? null : productId;
  }

  duplicateProduct(event: Event, product: ProductRecord) {
    event.stopPropagation();
    this.openDropdownId = null;
    const copy = this.productsService.duplicate(product.id);
    this.showToast(copy ? `"${product.name}" duplicated as a draft.` : 'Could not duplicate product.');
  }

  requestStatusChange(event: Event, product: ProductRecord, action: 'deactivate' | 'activate') {
    event.stopPropagation();
    this.openDropdownId = null;
    this.confirmTarget = product;
    this.confirmAction = action;
  }

  requestDelete(event: Event, product: ProductRecord) {
    event.stopPropagation();
    this.openDropdownId = null;
    this.confirmTarget = product;
    this.confirmAction = 'delete';
  }

  confirmActionExecute() {
    if (!this.confirmTarget || !this.confirmAction) return;
    const product = this.confirmTarget;
    if (this.confirmAction === 'deactivate') {
      this.productsService.setStatus(product.id, 'deactivated');
      this.showToast(`"${product.name}" deactivated.`);
    } else if (this.confirmAction === 'activate') {
      this.productsService.setStatus(product.id, 'live');
      this.showToast(`"${product.name}" activated.`);
    } else if (this.confirmAction === 'delete') {
      this.productsService.remove(product.id);
      this.showToast(`"${product.name}" deleted.`);
    }
    this.cancelConfirm();
  }

  cancelConfirm() {
    this.confirmTarget = null;
    this.confirmAction = null;
  }

  get confirmModalCopy() {
    const name = this.confirmTarget?.name ?? 'this product';
    switch (this.confirmAction) {
      case 'deactivate': return { title: 'Deactivate product?', message: `${name} will stop accepting new applications immediately. Existing loans are not affected.`, confirmLabel: 'Deactivate', danger: true };
      case 'activate': return { title: 'Activate product?', message: `${name} will start accepting new applications again.`, confirmLabel: 'Activate', danger: false };
      case 'delete': return { title: 'Delete product?', message: `This permanently removes ${name}. This cannot be undone.`, confirmLabel: 'Delete', danger: true };
      default: return { title: '', message: '', confirmLabel: 'Confirm', danger: false };
    }
  }

  private showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 3000);
  }

  statusLabel(status: ProductStatus): string {
    if (status === 'live') return 'Live';
    if (status === 'draft') return 'Draft';
    return 'Deactivated';
  }
}
