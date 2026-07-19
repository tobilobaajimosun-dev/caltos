import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent,
  ButtonComponent, ModalComponent, SelectComponent, SelectOption, InputComponent, ToastComponent,
} from '../../../shared/components';
import { ProductsService, ProductRecord, ProductVendor } from '../../../shared/services/products.service';

interface VendorRow {
  vendor: ProductVendor;
  productId: string;
  productName: string;
}

interface VendorLoan {
  borrower: string;
  amount: string;
  disbursed: string;
  status: 'successful' | 'pending' | 'overdue';
  statusLabel: string;
}

interface VendorInvoice {
  number: string;
  amount: string;
  date: string;
}

@Component({
  selector: 'app-vendor-management',
  imports: [
    KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent,
    ButtonComponent, ModalComponent, SelectComponent, InputComponent, ToastComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vendor-management.component.html',
  styleUrl: './vendor-management.component.scss',
})
export class VendorManagementComponent {
  private readonly productsService = inject(ProductsService);

  readonly bnplProducts = computed<ProductRecord[]>(() =>
    this.productsService.products().filter((p) => p.type === 'bnpl'),
  );

  readonly productOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: 'All BNPL products' },
    ...this.bnplProducts().map((p) => ({ value: p.id, label: p.name })),
  ]);

  readonly selectedProductId = signal('all');
  setProduct(id: string) { this.selectedProductId.set(id); this.selectedRow.set(null); }

  readonly vendorRows = computed<VendorRow[]>(() => {
    const scope = this.selectedProductId();
    return this.bnplProducts()
      .filter((p) => scope === 'all' || p.id === scope)
      .flatMap((p) => (p.vendors ?? []).map((vendor) => ({ vendor, productId: p.id, productName: p.name })));
  });

  readonly totalVendors = computed(() => this.vendorRows().length);
  readonly activeVendors = computed(() => this.vendorRows().filter((r) => (r.vendor.status ?? 'active') === 'active').length);
  readonly productsWithVendors = computed(() => this.bnplProducts().filter((p) => (p.vendors ?? []).length > 0).length);

  limitsLabel(v: ProductVendor): string {
    if (!v.minAmount && !v.maxAmount) return '—';
    return `₦${v.minAmount || '0'} – ₦${v.maxAmount || '∞'}`;
  }

  // ── Onboard / edit modal ─────────────────────────────────────────────────────
  readonly modalOpen = signal(false);
  readonly editingVendorId = signal<string | null>(null);
  formBusinessName = '';
  formCategory = '';
  formMinAmount = '';
  formMaxAmount = '';
  formProductId = '';

  openOnboard() {
    this.editingVendorId.set(null);
    this.formBusinessName = '';
    this.formCategory = '';
    this.formMinAmount = '';
    this.formMaxAmount = '';
    const scope = this.selectedProductId();
    this.formProductId = scope !== 'all' ? scope : (this.bnplProducts()[0]?.id ?? '');
    this.modalOpen.set(true);
  }

  openEdit(row: VendorRow) {
    this.editingVendorId.set(row.vendor.id);
    this.formBusinessName = row.vendor.businessName;
    this.formCategory = row.vendor.category;
    this.formMinAmount = row.vendor.minAmount ?? '';
    this.formMaxAmount = row.vendor.maxAmount ?? '';
    this.formProductId = row.productId;
    this.modalOpen.set(true);
  }

  get formValid(): boolean {
    return !!this.formBusinessName.trim() && !!this.formCategory.trim() && !!this.formProductId;
  }

  saveVendor() {
    if (!this.formValid) return;
    const product = this.bnplProducts().find((p) => p.id === this.formProductId);
    if (!product) return;
    const vendors = [...(product.vendors ?? [])];
    const editingId = this.editingVendorId();
    if (editingId) {
      const i = vendors.findIndex((v) => v.id === editingId);
      if (i > -1) {
        vendors[i] = { ...vendors[i], businessName: this.formBusinessName.trim(), category: this.formCategory.trim(), minAmount: this.formMinAmount, maxAmount: this.formMaxAmount };
      }
    } else {
      vendors.push({
        id: `ven-${Date.now()}`,
        businessName: this.formBusinessName.trim(),
        category: this.formCategory.trim(),
        slug: this.formBusinessName.trim().toLowerCase().replace(/\s+/g, '-'),
        status: 'active',
        minAmount: this.formMinAmount,
        maxAmount: this.formMaxAmount,
      });
    }
    this.productsService.update(product.id, { vendors });
    this.modalOpen.set(false);
    this.showToast(editingId ? `"${this.formBusinessName}" updated.` : `"${this.formBusinessName}" onboarded to ${product.name}.`);
  }

  removeVendor(row: VendorRow) {
    const product = this.bnplProducts().find((p) => p.id === row.productId);
    if (!product) return;
    this.productsService.update(product.id, { vendors: (product.vendors ?? []).filter((v) => v.id !== row.vendor.id) });
    this.selectedRow.set(null);
    this.showToast(`"${row.vendor.businessName}" removed.`);
  }

  // ── Vendor performance detail ────────────────────────────────────────────────
  readonly selectedRow = signal<VendorRow | null>(null);
  viewVendor(row: VendorRow) { this.selectedRow.set(row); }
  backToList() { this.selectedRow.set(null); }

  // Deterministic demo performance derived from the vendor id so numbers are
  // stable across visits until real loan↔vendor linkage exists.
  private seed(row: VendorRow): number {
    return [...row.vendor.id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  }

  perf(row: VendorRow) {
    const s = this.seed(row);
    const loans = 4 + (s % 9);
    const disbursed = loans * (350_000 + (s % 5) * 90_000);
    const rate = 82 + (s % 17);
    const outstanding = Math.round(disbursed * (1 - rate / 100));
    return {
      loans,
      disbursed: `₦${disbursed.toLocaleString()}`,
      rate: `${rate}%`,
      outstanding: `₦${outstanding.toLocaleString()}`,
    };
  }

  vendorLoans(row: VendorRow): VendorLoan[] {
    const s = this.seed(row);
    const borrowers = ['Aisha Bello', 'Emeka Nwosu', 'Funke Adebayo', 'Ibrahim Musa', 'Ngozi Eze', 'Tunde Salami'];
    const count = Math.min(4 + (s % 9), 6);
    return Array.from({ length: count }, (_, i) => {
      const amount = 180_000 + ((s + i * 37) % 6) * 65_000;
      const roll = (s + i) % 5;
      return {
        borrower: borrowers[(s + i) % borrowers.length],
        amount: `₦${amount.toLocaleString()}`,
        disbursed: `2026-0${1 + ((s + i) % 6)}-1${i % 3}`,
        status: roll === 4 ? 'overdue' : roll === 3 ? 'pending' : 'successful',
        statusLabel: roll === 4 ? 'Overdue' : roll === 3 ? 'In progress' : 'On track',
      } as VendorLoan;
    });
  }

  vendorInvoices(row: VendorRow): VendorInvoice[] {
    const s = this.seed(row);
    return Array.from({ length: 3 }, (_, i) => ({
      number: `INV-${row.vendor.slug.slice(0, 4).toUpperCase()}-${100 + (s % 90) + i}`,
      amount: `₦${(220_000 + ((s + i * 53) % 5) * 80_000).toLocaleString()}`,
      date: `2026-0${4 + i}-0${1 + ((s + i) % 9)}`,
    }));
  }

  // ── Toast ────────────────────────────────────────────────────────────────────
  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');
  private showToast(msg: string) {
    this.toastMessage.set(msg);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
