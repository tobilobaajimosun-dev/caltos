import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HiIconComponent, IconData } from '../../../shared/components/hi-icon/hi-icon.component';
import { ProductSettingsModalComponent } from '../product-settings-modal/product-settings-modal.component';
import { TooltipComponent, EmptyStateComponent, ButtonComponent, ConfirmModalComponent, ToastComponent, SearchComponent, RoundTabsComponent, Tab } from '../../../shared/components';
import { ProductsService, ProductRecord, ProductStatus } from '../../../shared/services/products.service';
import {
  InformationCircleIcon,
  FilterIcon,
  MoreVerticalIcon,
  PlusSignIcon,
  FileNotFoundIcon,
  Download01Icon,
} from '@hugeicons/core-free-icons';

type ActiveTab = 'all' | 'live' | 'draft' | 'deactivated' | 'fees';
type ProductTypeFilter = 'all' | 'loan' | 'bnpl';

interface Fee {
  name: string;
  type: 'Flat Fee' | 'Percentage';
  flatFee: string;
  percentage: string;
  minFee: string;
  maxFee: string;
  createdAt: string;
  menuOpen?: boolean;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    RouterLink, HiIconComponent, ProductSettingsModalComponent,
    TooltipComponent, EmptyStateComponent, ButtonComponent, ConfirmModalComponent, ToastComponent, SearchComponent,
    RoundTabsComponent,
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
  showSettingsDrawer = false;
  openDropdownId: string | null = null;

  readonly infoIcon: IconData = InformationCircleIcon as IconData;
  readonly filterIcon: IconData = FilterIcon as IconData;
  readonly downloadIcon: IconData = Download01Icon as IconData;
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

  filterPanelOpen = false;
  typeFilter: ProductTypeFilter = 'all';

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

  readonly productTabs: Tab[] = [
    { label: 'All Products', value: 'all' },
    { label: 'Live', value: 'live' },
    { label: 'Draft', value: 'draft' },
    { label: 'Deactivated', value: 'deactivated' },
    { label: 'Fees', value: 'fees' },
  ];

  get filteredProducts(): ProductRecord[] {
    let list = this.products();
    if (this.activeTab === 'live') list = list.filter((p) => p.status === 'live');
    else if (this.activeTab === 'draft') list = list.filter((p) => p.status === 'draft');
    else if (this.activeTab === 'deactivated') list = list.filter((p) => p.status === 'deactivated');

    if (this.typeFilter !== 'all') list = list.filter((p) => p.type === this.typeFilter);

    const q = this.searchQuery.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    return list;
  }

  toggleFilterPanel() {
    this.filterPanelOpen = !this.filterPanelOpen;
  }

  setTypeFilter(type: ProductTypeFilter) {
    this.typeFilter = type;
  }

  exportCsv() {
    const rows = this.filteredProducts;
    const header = 'Product ID,Name,Type,Status,Interest Rate,Min Amount,Max Amount,Active Loans,Total Disbursed,Collection Rate\n';
    const body = rows.map((p) =>
      `${p.id},"${p.name}",${p.type},${p.status},${p.interestRate}%,${p.minAmount},${p.maxAmount},${p.stats.activeLoans},${p.stats.totalDisbursed},${p.stats.collectionRate}%`,
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`Exported ${rows.length} product${rows.length === 1 ? '' : 's'}.`);
  }

  toggleFeeMenu(event: Event, fee: Fee) {
    event.stopPropagation();
    const wasOpen = fee.menuOpen;
    this.fees.forEach((f) => (f.menuOpen = false));
    fee.menuOpen = !wasOpen;
  }

  editFee(fee: Fee) {
    fee.menuOpen = false;
    this.showToast(`Editing "${fee.name}" is coming soon.`);
  }

  deleteFee(fee: Fee) {
    fee.menuOpen = false;
    this.showToast(`"${fee.name}" removed.`);
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

  setTab(tab: string) { this.activeTab = tab as ActiveTab; }

  navigateTo(id: string) {
    this.router.navigate(['/products', id]);
  }

  editProduct(product: ProductRecord) {
    this.router.navigate(['/products/create'], { queryParams: { id: product.id } });
  }

  closeDropdown() {
    this.openDropdownId = null;
    this.filterPanelOpen = false;
    this.fees.forEach((f) => (f.menuOpen = false));
  }

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
