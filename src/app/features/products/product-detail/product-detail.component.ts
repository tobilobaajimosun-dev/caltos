import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TooltipComponent, ButtonComponent, BreadcrumbComponent, ChartComponent, ChartDataPoint, ColumnTitleComponent, TableItemComponent, TableItemUser, StatusBadgeComponent, BadgeStatus } from '../../../shared/components';
import { ProductsService, ProductStats, ProductStatus } from '../../../shared/services/products.service';

type DetailTab = 'overview' | 'performance' | 'active-loans' | 'eligibility' | 'fees' | 'disbursement' | 'collections' | 'legal' | 'activity' | 'vendors';

interface ChannelPerformance {
  channel: string;
  status: 'connected' | 'pending';
  expected: number;
  collected: number;
  successRateTrend: ChartDataPoint[];
}

interface RecentException {
  customer: string;
  reason: string;
  amount: string;
  status: BadgeStatus;
}

interface ActiveLoanRow {
  id: string;
  customer: TableItemUser;
  amount: string;
  disbursedDate: string;
  outstanding: string;
  status: 'active' | 'overdue' | 'suspended';
}

interface Vendor {
  id: string;
  businessName: string;
  category: string;
  status: 'active' | 'pending' | 'suspended';
  settlementBank: string;
  settlementAccount: string;
  dateAdded: string;
  slug: string;
}

interface NewVendorDraft {
  businessName: string;
  cac: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  directorName: string;
  directorPhone: string;
  directorIdType: string;
  directorBvn: string;
  bankName: string;
  accountNumber: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  tab: DetailTab;
}

interface ProductData {
  name: string;
  type: 'loan' | 'bnpl';
  status: ProductStatus;
  createdAt: string;
  description: string;
  websiteLink: string;
  applyRoute: string;
  productId: string;
  minAmount: string;
  maxAmount: string;
  minTenor: string;
  maxTenor: string;
  tenorUnit: string;
  interestType: string;
  interestFrequency: string;
  interestRate: string;
  minInterest: string;
  maxInterest: string;
  eligibility: string[];
  activeLoanPolicy: string;
  kycDocs: string[];
  processingFee: { enabled: boolean; method: string; value: string; applyTo: string; min: string; max: string };
  customFees: { name: string; method: string; value: string; applyTo: string }[];
  offerLetter: string;
  disburseToSalary: string;
  autoDeductions: string;
  videoConfirmation: string;
  incomeChannels: { id: string; label: string; desc: string; status: 'connected' | 'pending' | 'not-configured' }[];
  deductionChannels: { id: string; label: string; desc: string; coverage: string; status: 'connected' | 'pending' | 'not-configured'; priority: number }[];
  repaymentFrequency: string;
  minRepayments: string;
  maxRepayments: string;
  firstPaymentOffset: string;
  repaymentOrder: string[];
  activateImmediately: boolean;
  latePenalty: { enabled: boolean; type: string; value: string; frequency: string; gracePeriod: string };
  policyText: string;
}

const LOAN_PRODUCT_BASE: ProductData = {
  name: 'Corper Wallet',
  type: 'loan',
  status: 'live',
  createdAt: 'Aug 29, 2024, 3:52:12 PM GMT',
  description: 'Short-term cash advance for active NYSC corps members. Verified through NYSC call-up details and Remita salary data, with monthly deductions from stipend.',
  websiteLink: 'apply.caltos.co/princeps/corper-wallet',
  applyRoute: '/apply',
  productId: 'CW001',
  minAmount: '30,000',
  maxAmount: '100,000',
  minTenor: '3',
  maxTenor: '9',
  tenorUnit: 'Months',
  interestType: 'Flat Rate',
  interestFrequency: 'Monthly',
  interestRate: '7.5',
  minInterest: '500',
  maxInterest: '5,000',
  eligibility: ['Remita', 'IPPIS', 'Salary Earner'],
  activeLoanPolicy: 'Restricted — borrowers must repay their active loan before reapplying.',
  kycDocs: ['National ID (NIN)', 'Utility Bill', 'Last 3 months payslip', 'Bank statement (6 months)'],
  processingFee: { enabled: true, method: 'Percentage', value: '1.5%', applyTo: 'Loan Amount', min: '₦750', max: '₦1,550' },
  customFees: [{ name: 'Admin Fee', method: 'Flat Fee', value: '₦2,500', applyTo: 'Per Loan' }],
  offerLetter: 'Digital signature required',
  disburseToSalary: 'Yes',
  autoDeductions: 'No',
  videoConfirmation: 'No',
  incomeChannels: [
    { id: 'remita',   label: 'Remita',        desc: 'Salary verification via Remita',           status: 'connected' },
    { id: 'ippis',    label: 'IPPIS',          desc: 'Federal payroll verification',             status: 'pending' },
    { id: 'bank',     label: 'Bank Statement', desc: 'Automated bank statement analysis',        status: 'connected' },
  ],
  deductionChannels: [
    { id: 'ippis',   label: 'IPPIS',        desc: 'At-source payroll deduction',       coverage: 'Federal MDAs only',    status: 'pending',       priority: 1 },
    { id: 'remita',  label: 'Remita',       desc: 'Standing order / salary mandate',   coverage: 'Federal + some states', status: 'connected',     priority: 2 },
    { id: 'direct',  label: 'Direct Debit', desc: 'Bank account debit on due date',    coverage: 'Any bank',             status: 'not-configured', priority: 3 },
  ],
  repaymentFrequency: 'Monthly',
  minRepayments: '3',
  maxRepayments: '9',
  firstPaymentOffset: '30 days after disbursement',
  repaymentOrder: ['Fees', 'Interest', 'Penalty', 'Principal'],
  activateImmediately: true,
  latePenalty: { enabled: true, type: 'Percentage', value: '2%', frequency: 'Daily', gracePeriod: '3 days' },
  policyText: `By applying, you agree that Princeps Finance may verify your employment, salary, and credit history from third-party sources to assess your eligibility. If approved, your monthly repayments will be automatically deducted from your salary before funds are credited to your account. Any outstanding balance in the event of default may be recovered from your other linked accounts.\n\nBy checking this box, you confirm that you have read and accept our Privacy Policy and Loan Terms & Conditions.`,
};

const MOCK_PRODUCTS: Record<string, ProductData> = {
  CW001: LOAN_PRODUCT_BASE,
  CRI02: { ...LOAN_PRODUCT_BASE, name: 'Credit Wallet', productId: 'CRI02', minTenor: '6', maxTenor: '12', websiteLink: 'apply.caltos.co/princeps/credit-wallet' },
  CA100: { ...LOAN_PRODUCT_BASE, name: 'Credit Alert', productId: 'CA100', minTenor: '12', maxTenor: '24', interestFrequency: 'Daily', websiteLink: 'apply.caltos.co/princeps/credit-alert' },
  WCR03: { ...LOAN_PRODUCT_BASE, name: 'WACS', productId: 'WCR03', status: 'deactivated', minTenor: '24', maxTenor: '52', websiteLink: 'apply.caltos.co/princeps/wacs' },
  QB001: {
    name: 'Quick Buy BNPL',
    type: 'bnpl',
    status: 'live',
    createdAt: 'Jun 12, 2025, 10:14:22 AM GMT',
    description: 'Instant purchase financing for goods and services. Customers shop now and repay in instalments. Funds go directly to vendor settlement accounts.',
    websiteLink: 'apply.caltos.co/princeps/bnpl/quick-buy/[vendor-slug]',
    applyRoute: '/apply',
    productId: 'QB001',
    minAmount: '20,000',
    maxAmount: '500,000',
    minTenor: '1',
    maxTenor: '12',
    tenorUnit: 'Months',
    interestType: 'Flat Rate',
    interestFrequency: 'Monthly',
    interestRate: '5.0',
    minInterest: '500',
    maxInterest: '10,000',
    eligibility: ['BVN', 'Phone OTP'],
    activeLoanPolicy: 'Allowed — borrowers may have multiple active BNPL plans.',
    kycDocs: ['Government Issued ID (Required)', 'Utility Bill (Optional)'],
    processingFee: { enabled: true, method: 'Percentage', value: '1.5%', applyTo: 'Purchase Amount', min: '₦500', max: '₦5,000' },
    customFees: [],
    offerLetter: 'Not required',
    disburseToSalary: 'No — funds go to vendor settlement account',
    autoDeductions: 'No',
    videoConfirmation: 'No',
    incomeChannels: [
      { id: 'bank', label: 'Bank Statement', desc: 'Automated bank statement analysis', status: 'connected' },
    ],
    deductionChannels: [
      { id: 'direct', label: 'Direct Debit', desc: 'Bank account debit on due date', coverage: 'Any bank', status: 'connected', priority: 1 },
    ],
    repaymentFrequency: 'Monthly',
    minRepayments: '1',
    maxRepayments: '12',
    firstPaymentOffset: '30 days after purchase',
    repaymentOrder: ['Fees', 'Interest', 'Penalty', 'Principal'],
    activateImmediately: true,
    latePenalty: { enabled: true, type: 'Percentage', value: '1.5%', frequency: 'Daily', gracePeriod: '3 days' },
    policyText: `By proceeding with this purchase, you agree that Princeps Finance will finance this transaction on your behalf. Repayment will be made in equal monthly instalments as agreed. Failure to repay may result in reporting to credit bureaus and recovery action.\n\nBy checking this box, you confirm that you have read and accept our Privacy Policy and BNPL Terms & Conditions.`,
  },
};

const BNPL_SAMPLE_VENDORS: Vendor[] = [
  { id: 'v1', businessName: 'TechHub Electronics', category: 'Electronics & Gadgets', status: 'active', settlementBank: 'Access Bank', settlementAccount: '0123456789', dateAdded: 'Jun 12, 2025', slug: 'techhub-electronics' },
  { id: 'v2', businessName: 'FashionKloth Ltd', category: 'Fashion & Clothing', status: 'active', settlementBank: 'GTBank', settlementAccount: '0987654321', dateAdded: 'Jun 18, 2025', slug: 'fashionkloth-ltd' },
];

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, TooltipComponent, ButtonComponent, BreadcrumbComponent, ChartComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);

  activeTab: DetailTab = 'overview';
  statPeriod: 'today' | 'week' | 'month' | 'all' = 'month';

  productStats: ProductStats = {
    totalApplications: 0, approvalRate: 0, avgLoanSize: '₦0', activeLoans: 0,
    totalDisbursed: '₦0', collectionRate: 0, nplRate: 0,
  };

  readonly disbursementTrend: ChartDataPoint[] = [
    { label: 'Feb', value: 10 }, { label: 'Mar', value: 14 }, { label: 'Apr', value: 12 },
    { label: 'May', value: 18 }, { label: 'Jun', value: 16 }, { label: 'Jul', value: 22 },
  ];

  activeLoans: ActiveLoanRow[] = [];

  channelPerformance: ChannelPerformance[] = [];
  overdueRate = 0;
  overdueBuckets = { d30: 0, d60: 0, d90: 0 };
  avgDaysToFirstMissed = 0;
  recentExceptions: RecentException[] = [];
  lastReconciliationRun = '';
  outstandingVarianceCount = 0;
  outstandingVarianceValue = '₦0';

  // Vendor management state
  showOnboardModal = false;
  onboardStep = 0;
  copiedVendorId: string | null = null;

  readonly accountNameVerifying = signal(false);
  readonly accountName = signal('');
  readonly accountNameVerified = signal(false);
  readonly accountNameError = signal('');

  vendors: Vendor[] = [];

  newVendor: NewVendorDraft = {
    businessName: '',
    cac: '',
    category: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    directorName: '',
    directorPhone: '',
    directorIdType: 'Passport',
    directorBvn: '',
    bankName: '',
    accountNumber: '',
  };

  readonly nigerianBanks = [
    'Access Bank', 'Citibank', 'Ecobank', 'FCMB', 'Fidelity Bank',
    'First Bank', 'GTBank', 'Heritage Bank', 'Keystone Bank', 'Polaris Bank',
    'Stanbic IBTC', 'Standard Chartered', 'Sterling Bank', 'UBA', 'Union Bank',
    'Unity Bank', 'Wema Bank', 'Zenith Bank',
  ];

  readonly bnplCategories = [
    'Electronics & Gadgets', 'Fashion & Clothing', 'Food & Groceries',
    'Education & School Supplies', 'Health & Wellness', 'Home & Furniture',
    'Travel & Experiences', 'Agricultural Inputs', 'Building Materials', 'Automotive Parts',
  ];

  product: ProductData = MOCK_PRODUCTS['CW001'];

  checklist: ChecklistItem[] = [
    { id: 'details',      label: 'Set loan terms',              description: 'Set your loan name, amount limits, tenor range, and interest structure.',       done: true,  tab: 'overview'     },
    { id: 'eligibility',  label: 'Define who qualifies',        description: 'Define who qualifies and the documents they need to provide.',                  done: false, tab: 'eligibility'  },
    { id: 'fees',         label: 'Set your pricing',           description: 'Add processing fees, custom charges, and late payment penalties.',               done: true,  tab: 'fees'         },
    { id: 'disbursement', label: 'Configure payouts',          description: 'Configure how funds go out and repayments come in.',                             done: false, tab: 'disbursement' },
    { id: 'integration',  label: 'Connect your channels',      description: 'Connect Remita or NIBSS to enable automated salary deductions.',                 done: false, tab: 'disbursement' },
    { id: 'target',       label: 'Set a disbursement goal',    description: 'Set a disbursement target and track your portfolio performance.',                 done: false, tab: 'overview'     },
    { id: 'legal',        label: 'Add consent text',           description: 'Add consent language so borrowers know exactly what they\'re agreeing to.',       done: true,  tab: 'legal'        },
    { id: 'portal',       label: 'Go live',                    description: 'Your product is live and accepting applications.',                                done: true,  tab: 'overview'     },
  ];

  setupExpanded = true;

  get completedCount() { return this.checklist.filter(c => c.done).length; }
  get isFullySetup() { return this.completedCount === this.checklist.length; }
  get setupPct() { return Math.round((this.completedCount / this.checklist.length) * 100); }
  get pendingItems() { return this.checklist.filter(c => !c.done); }
  get pendingLabels() { return this.pendingItems.map(i => i.label).join(' · '); }

  private readonly route = inject(ActivatedRoute);

  productId = 'CW001';

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = (params['id'] as string) ?? 'CW001';
      this.productId = id;
      this.product = MOCK_PRODUCTS[id] ?? MOCK_PRODUCTS['CW001'];
      this.vendors = this.product.type === 'bnpl' ? [...BNPL_SAMPLE_VENDORS] : [];
      this.activeTab = 'overview';

      const record = this.productsService.getById(id);
      if (record) {
        this.product = { ...this.product, name: record.name, status: record.status, createdAt: record.createdAt };
        this.productStats = record.stats;
      }

      this.activeLoans = this.buildMockActiveLoans();
      this.buildCollectionsData();
    });
  }

  private buildCollectionsData() {
    this.channelPerformance = this.product.deductionChannels.map((ch, i) => {
      const expected = 1_500_000 + i * 620_000;
      const variancePct = ch.status === 'connected' ? 0.92 - i * 0.05 : 0.6;
      return {
        channel: ch.label,
        status: ch.status === 'connected' ? 'connected' : 'pending',
        expected,
        collected: Math.round(expected * variancePct),
        successRateTrend: [
          { label: '3mo ago', value: Math.round((variancePct - 0.06) * 100) },
          { label: '2mo ago', value: Math.round((variancePct - 0.02) * 100) },
          { label: 'Last mo', value: Math.round(variancePct * 100) },
        ],
      };
    });

    const overdueCount = this.activeLoans.filter((l) => l.status === 'overdue').length;
    this.overdueRate = this.activeLoans.length ? Math.round((overdueCount / this.activeLoans.length) * 100) : 0;
    this.overdueBuckets = { d30: overdueCount, d60: Math.max(0, overdueCount - 1), d90: Math.max(0, overdueCount - 2) };
    this.avgDaysToFirstMissed = 34;

    this.recentExceptions = this.activeLoans.slice(0, 10).map((loan, i) => ({
      customer: loan.customer.name,
      reason: i % 2 === 0 ? 'Amount mismatch vs. schedule' : 'Failed deduction — insufficient balance',
      amount: loan.outstanding,
      status: i % 2 === 0 ? 'pending' : 'overdue',
    }));

    this.lastReconciliationRun = '2026-07-04 06:00';
    this.outstandingVarianceCount = 3;
    this.outstandingVarianceValue = '₦186,500';
  }

  private buildMockActiveLoans(): ActiveLoanRow[] {
    const names = [
      { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' },
      { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' },
      { name: 'Chika Okafor', email: 'chika@princepsfinance.com' },
      { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' },
    ];
    const statuses: ActiveLoanRow['status'][] = ['active', 'active', 'overdue', 'active'];
    return names.map((customer, i) => ({
      id: `${this.productId}-L${(i + 1).toString().padStart(3, '0')}`,
      customer,
      amount: `₦${(50 + i * 20).toLocaleString()},000`,
      disbursedDate: '2026-06-1' + (i + 1),
      outstanding: `₦${(30 + i * 15).toLocaleString()},000`,
      status: statuses[i],
    }));
  }

  editProduct() {
    this.router.navigate(['/products/create'], { queryParams: { id: this.productId } });
  }

  togglePublish() {
    const next: ProductStatus = this.product.status === 'live' ? 'deactivated' : 'live';
    this.productsService.setStatus(this.productId, next);
    this.product = { ...this.product, status: next };
  }

  statusLabel(status: ProductStatus): string {
    if (status === 'live') return 'Live';
    if (status === 'draft') return 'Draft';
    return 'Deactivated';
  }

  setTab(tab: DetailTab) { this.activeTab = tab; }

  goToTab(tab: DetailTab) {
    this.setTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  copyLink() {
    navigator.clipboard.writeText(this.product.websiteLink).catch(() => {});
  }

  get isBnpl(): boolean { return this.product.type === 'bnpl'; }

  openOnboardModal() {
    this.onboardStep = 0;
    this.newVendor = {
      businessName: '', cac: '', category: '', address: '', phone: '', email: '', website: '',
      directorName: '', directorPhone: '', directorIdType: 'Passport', directorBvn: '',
      bankName: '', accountNumber: '',
    };
    this.accountNameVerifying.set(false);
    this.accountName.set('');
    this.accountNameVerified.set(false);
    this.accountNameError.set('');
    this.showOnboardModal = true;
  }

  onboardNext() { if (this.onboardStep < 3) this.onboardStep++; }
  onboardBack() { if (this.onboardStep > 0) this.onboardStep--; }

  resetAccountNameVerification() {
    this.accountName.set('');
    this.accountNameVerified.set(false);
    this.accountNameError.set('');
  }

  verifyAccountName() {
    this.resetAccountNameVerification();
    if (this.newVendor.accountNumber.length < 10) return;
    this.accountNameVerifying.set(true);
    setTimeout(() => {
      this.accountNameVerifying.set(false);
      const normalized = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');
      const fetched = 'TECHHUB ELECTRONICS LIMITED';
      this.accountName.set(fetched);
      const match = normalized(fetched).includes(normalized(this.newVendor.businessName)) ||
                    normalized(this.newVendor.businessName).includes(normalized(fetched).slice(0, 6));
      if (match) {
        this.accountNameVerified.set(true);
      } else {
        this.accountNameError.set(`Settlement account name ("${fetched}") does not match the business name provided. Please check and try again.`);
      }
    }, 1200);
  }

  confirmOnboard() {
    const slug = this.newVendor.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    this.vendors.push({
      id: 'v' + Date.now(),
      businessName: this.newVendor.businessName,
      category: this.newVendor.category,
      status: 'active',
      settlementBank: this.newVendor.bankName,
      settlementAccount: this.newVendor.accountNumber,
      dateAdded: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      slug,
    });
    this.showOnboardModal = false;
    this.activeTab = 'vendors';
  }

  vendorLink(vendor: Vendor): string {
    const productSlug = this.product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `https://apply.caltos.co/princeps/bnpl/${productSlug}/${vendor.slug}`;
  }

  copyVendorLink(vendor: Vendor) {
    navigator.clipboard.writeText(this.vendorLink(vendor)).catch(() => {});
    this.copiedVendorId = vendor.id;
    setTimeout(() => { this.copiedVendorId = null; }, 2000);
  }

  suspendVendor(vendor: Vendor) {
    vendor.status = vendor.status === 'suspended' ? 'active' : 'suspended';
  }

  removeVendor(id: string) {
    this.vendors = this.vendors.filter(v => v.id !== id);
  }
}
