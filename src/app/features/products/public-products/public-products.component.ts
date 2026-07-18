import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LowerCasePipe } from '@angular/common';
import { ProductsService, ProductRecord, ApplicantProfile, AUDIENCE_INCOME_METHODS, AUDIENCE_CATEGORY_LABELS } from '../../../shared/services/products.service';
import { OrgBrandingService } from '../../../shared/services/org-branding.service';

type FilterType = 'all' | 'loan' | 'bnpl';

const INCOME_METHOD_LABELS: Record<string, string> = {
  remita: 'Remita',
  wacs: 'IPPIS / WACS',
  payslip: 'Payslip',
  'bank-statement': 'Bank Statement',
  'business-revenue': 'Business Revenue',
};

@Component({
  selector: 'app-public-products',
  imports: [FormsModule, LowerCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './public-products.component.html',
  styleUrl: './public-products.component.scss',
})
export class PublicProductsComponent {
  private readonly productsService = inject(ProductsService);
  private readonly orgBranding = inject(OrgBrandingService);

  readonly branding = this.orgBranding.branding;
  readonly searchQuery = signal('');
  readonly activeFilter = signal<FilterType>('all');

  readonly liveProducts = computed(() =>
    this.productsService.products().filter((p) => p.status === 'live'),
  );

  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.activeFilter();
    return this.liveProducts().filter((p) => {
      const matchesType = filter === 'all' || p.type === filter;
      const matchesQuery = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  });

  readonly hasLoanProducts = computed(() => this.liveProducts().some((p) => p.type === 'loan'));
  readonly hasBnplProducts = computed(() => this.liveProducts().some((p) => p.type === 'bnpl'));
  readonly loanProductCount = computed(() => this.liveProducts().filter((p) => p.type === 'loan').length);
  readonly bnplProductCount = computed(() => this.liveProducts().filter((p) => p.type === 'bnpl').length);

  applyUrl(product: ProductRecord): string {
    return `/apply?product=${product.id}`;
  }

  audienceLabels(product: ProductRecord): string[] {
    const profiles: ApplicantProfile[] = product.config.applicantProfiles ?? [];
    if (profiles.length) {
      return profiles
        .map((p) => p.audience ? AUDIENCE_CATEGORY_LABELS[p.audience] : p.label)
        .filter(Boolean) as string[];
    }
    const config = product.config as any;
    const audiences: string[] = [];
    if (config.audiences?.includes('public-civil-servant') || config.incomeIppis || config.incomeRemita) {
      audiences.push('Public Servants');
    }
    if (config.audiences?.includes('private-sector-worker') || config.incomeBankStatement) {
      audiences.push('Private Sector Workers');
    }
    return audiences.length ? audiences : ['Open to all'];
  }

  incomeMethodLabels(product: ProductRecord): string[] {
    const methods = new Set<string>();
    const profiles: ApplicantProfile[] = product.config.applicantProfiles ?? [];
    if (profiles.length) {
      for (const profile of profiles) {
        if (profile.audience) {
          AUDIENCE_INCOME_METHODS[profile.audience]?.forEach((m: string) => methods.add(m));
        }
      }
    } else {
      const config = product.config as any;
      if (config?.incomeRemita) methods.add('remita');
      if (config?.incomeIppis) methods.add('wacs');
      if (config?.incomeBankStatement) methods.add('bank-statement');
    }
    return Array.from(methods).map((m) => INCOME_METHOD_LABELS[m] ?? m);
  }

  formatAmount(val: string | number): string {
    const n = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
    if (isNaN(n)) return val as string;
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
    return `₦${n.toLocaleString()}`;
  }

  productTypeLabel(type: string): string {
    return type === 'bnpl' ? 'Buy Now Pay Later' : 'Loan';
  }

  setFilter(f: FilterType) { this.activeFilter.set(f); }
  setSearch(q: string) { this.searchQuery.set(q); }
}
