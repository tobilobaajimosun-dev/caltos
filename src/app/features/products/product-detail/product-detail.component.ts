import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SidebarComponent, TooltipComponent } from '../../../shared/components';

type DetailTab = 'overview' | 'eligibility' | 'fees' | 'disbursement' | 'legal' | 'activity' | 'vendors';

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
  accountName: string;
  accountNameVerified: boolean;
  accountNameError: string;
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
  status: 'live' | 'deactivated';
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
  imports: [RouterLink, FormsModule, SidebarComponent, TooltipComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  activeTab: DetailTab = 'overview';
  statPeriod: 'today' | 'week' | 'month' | 'all' = 'month';

  // Vendor management state
  showOnboardModal = false;
  onboardStep = 0;
  accountNameVerifying = false;
  copiedVendorId: string | null = null;

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
    accountName: '',
    accountNameVerified: false,
    accountNameError: '',
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

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'] as string;
      this.product = MOCK_PRODUCTS[id] ?? MOCK_PRODUCTS['CW001'];
      this.vendors = this.product.type === 'bnpl' ? [...BNPL_SAMPLE_VENDORS] : [];
      this.activeTab = 'overview';
    });
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
      bankName: '', accountNumber: '', accountName: '', accountNameVerified: false, accountNameError: '',
    };
    this.showOnboardModal = true;
  }

  onboardNext() { if (this.onboardStep < 3) this.onboardStep++; }
  onboardBack() { if (this.onboardStep > 0) this.onboardStep--; }

  verifyAccountName() {
    this.newVendor.accountName = '';
    this.newVendor.accountNameVerified = false;
    this.newVendor.accountNameError = '';
    if (this.newVendor.accountNumber.length < 10) return;
    this.accountNameVerifying = true;
    setTimeout(() => {
      this.accountNameVerifying = false;
      const normalized = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');
      const fetched = 'TECHHUB ELECTRONICS LIMITED';
      this.newVendor.accountName = fetched;
      const match = normalized(fetched).includes(normalized(this.newVendor.businessName)) ||
                    normalized(this.newVendor.businessName).includes(normalized(fetched).slice(0, 6));
      if (match) {
        this.newVendor.accountNameVerified = true;
      } else {
        this.newVendor.accountNameError = `Settlement account name ("${fetched}") does not match the business name provided. Please check and try again.`;
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
