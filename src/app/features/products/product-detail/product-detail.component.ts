import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HiIconComponent, IconData } from '../../../shared/components/hi-icon/hi-icon.component';
import { InfoPopoverComponent, ButtonComponent, ChartComponent, ChartDataPoint, ChartSeries, ColumnTitleComponent, TableItemComponent, TableItemUser, StatusBadgeComponent, BadgeStatus, RoundTabsComponent, Tab, ModalComponent, SelectComponent, SelectOption, TabsComponent, TabItem, ToastComponent, KpiCardComponent, EmptyStateComponent, CheckboxComponent } from '../../../shared/components';
import { ProductsService, ProductStats, ProductStatus } from '../../../shared/services/products.service';
import {
  ArrowLeft02Icon,
  PauseIcon,
  MoreVerticalIcon,
  Link04Icon,
  Copy01Icon,
  ArrowUpRight01Icon,
  Settings02Icon,
  Cashier02Icon,
  Money04Icon,
  UserGroup03Icon,
  AlertDiamondIcon,
  IdentificationIcon,
  Money02Icon,
  CheckmarkBadge01Icon,
  ArrowDown01Icon,
  Plug01Icon,
  ShoppingBag01Icon,
} from '@hugeicons/core-free-icons';

type DetailTab = 'overview' | 'performance' | 'active-loans' | 'eligibility' | 'fees' | 'disbursement' | 'collections' | 'legal' | 'activity' | 'vendors' | 'integrations';

type IntegrationTag = 'deduction' | 'direct debit' | 'disbursements' | 'marketplace' | 'verification' | 'signature';

interface IntegrationField {
  key: string;
  label: string;
}

interface IntegrationDef {
  id: string;
  name: string;
  initials: string;
  color: string;
  tags: IntegrationTag[];
  whatItDoes: string;
  whatYouNeed: string[];
  whatHappensAfter: string[];
  notes?: string;
  fields: IntegrationField[];
}

const ALL_INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'mono', name: 'Mono', initials: 'MO', color: '#1F2A44',
    tags: ['verification'],
    whatItDoes: 'Links a borrower\'s bank account to retrieve statements and verify identity, so you can confirm income and account ownership before disbursing.',
    whatYouNeed: ['A Mono business account', 'Secret key and public key from your Mono dashboard'],
    whatHappensAfter: ['Borrowers can link their bank account during onboarding', 'Account and income verification runs automatically', 'Verification status is recorded against each applicant'],
    notes: 'Statement retrieval is billed per successful pull by Mono.',
    fields: [{ key: 'secretKey', label: 'Secret key' }, { key: 'publicKey', label: 'Public key' }],
  },
  {
    id: 'paystack', name: 'Paystack', initials: 'PS', color: '#00C3F7',
    tags: ['direct debit'],
    whatItDoes: 'Processes payments and recurring direct debit mandates, letting you collect repayments automatically from a borrower\'s linked card or account.',
    whatYouNeed: ['A Paystack business account', 'Secret key and public key from your Paystack dashboard'],
    whatHappensAfter: ['Borrowers authorize a repayment mandate at loan signup', 'Scheduled repayments are auto-charged on their due date', 'Failed charges are retried and logged as exceptions'],
    fields: [{ key: 'secretKey', label: 'Secret key' }, { key: 'publicKey', label: 'Public key' }],
  },
  {
    id: 'remita', name: 'Remita', initials: 'RM', color: '#00A651',
    tags: ['deduction'],
    whatItDoes: 'Enables salary-based deductions for federal and state government workers — the primary rail for at-source loan repayment collection.',
    whatYouNeed: ['A registered Remita merchant profile', 'Merchant ID, API Key, Service Type ID, and API Token from Remita'],
    whatHappensAfter: ['Eligible borrowers are matched against Remita payroll records', 'Repayments are deducted at source before salary is paid out', 'Deduction results post back to this product\'s repayment ledger'],
    fields: [{ key: 'merchantId', label: 'Merchant ID' }, { key: 'apiKey', label: 'API Key' }, { key: 'serviceTypeId', label: 'Service Type ID' }, { key: 'apiToken', label: 'API Token' }],
  },
  {
    id: 'dedukt', name: 'Dedukt', initials: 'DK', color: '#6B4EFF',
    tags: ['deduction'],
    whatItDoes: 'Automates payroll deductions for participating employers, giving you a direct channel to collect repayments from a borrower\'s salary.',
    whatYouNeed: ['An active Dedukt account', 'An API Key from your Dedukt dashboard'],
    whatHappensAfter: ['Borrowers on a Dedukt-connected payroll are flagged as eligible', 'Deduction instructions are sent to the employer\'s payroll each cycle', 'Confirmed deductions are reconciled against the loan schedule'],
    fields: [{ key: 'apiKey', label: 'API Key' }],
  },
  {
    id: 'dedukt-v2', name: 'Dedukt v2', initials: 'D2', color: '#5A3FE0',
    tags: ['deduction'],
    whatItDoes: 'The newer OAuth-based Dedukt integration — the same payroll-deduction rail, authenticated with client credentials instead of a single API key.',
    whatYouNeed: ['An active Dedukt v2 account', 'Client ID, Client Secret, and Base URL from Dedukt'],
    whatHappensAfter: ['Requests authenticate via OAuth client credentials', 'Deduction instructions and confirmations flow the same as Dedukt v1', 'Tokens refresh automatically without manual re-entry'],
    notes: 'Use this instead of the original Dedukt integration if your employer partner has migrated to their v2 API.',
    fields: [{ key: 'clientId', label: 'Client ID' }, { key: 'clientSecret', label: 'Client Secret' }, { key: 'baseUrl', label: 'Base URL' }],
  },
  {
    id: 'remita-salary', name: 'Remita Salary', initials: 'RS', color: '#00873E',
    tags: ['deduction'],
    whatItDoes: 'A dedicated Remita product for salary-earner verification and deduction mandates, used alongside standard Remita for payroll-linked loan products.',
    whatYouNeed: ['A registered Remita Salary merchant profile', 'Merchant ID, API Key, and API Token'],
    whatHappensAfter: ['Salary-earner status is verified before approval', 'A deduction mandate is set up against the borrower\'s salary account', 'Repayment status updates flow back automatically'],
    fields: [{ key: 'merchantId', label: 'Merchant ID' }, { key: 'apiKey', label: 'API Key' }, { key: 'apiToken', label: 'API Token' }],
  },
  {
    id: 'wacs', name: 'WACS', initials: 'WC', color: '#B8860B',
    tags: ['deduction'],
    whatItDoes: 'The Web Account Clearing System routes salary deductions for select public-sector workplaces not covered by Remita or IPPIS.',
    whatYouNeed: ['WACS platform credentials (username and password)', 'A secret key issued by WACS'],
    whatHappensAfter: ['Borrowers at supported workplaces are matched against WACS records', 'Deduction requests are submitted each payroll cycle', 'Cleared deductions are posted to the repayment schedule'],
    fields: [{ key: 'username', label: 'Username' }, { key: 'password', label: 'Password' }, { key: 'secretKey', label: 'Secret key' }],
  },
  {
    id: 'monnify', name: 'Monnify', initials: 'MN', color: '#0033A0',
    tags: ['disbursements'],
    whatItDoes: 'Handles bulk and single-transfer disbursements straight to a borrower\'s bank account once a loan is approved.',
    whatYouNeed: ['A Monnify merchant account with a funded source account', 'API Key, Secret Key, Contract Code, Source Account number, and Base URL'],
    whatHappensAfter: ['Approved loans trigger an automatic transfer request', 'Funds move from your source account to the borrower\'s bank account', 'Transfer status (successful/failed) is recorded on the loan'],
    fields: [{ key: 'apiKey', label: 'API Key' }, { key: 'secretKey', label: 'Secret Key' }, { key: 'contractCode', label: 'Contract Code' }, { key: 'sourceAccount', label: 'Source Account number' }, { key: 'baseUrl', label: 'Base URL' }],
  },
  {
    id: 'paystack-disbursement', name: 'Paystack Disbursement', initials: 'PD', color: '#00A8E8',
    tags: ['disbursements'],
    whatItDoes: 'Paystack\'s transfer API, used here purely for sending approved loan funds to a borrower\'s bank account.',
    whatYouNeed: ['A Paystack business account with transfers enabled', 'Public Key and Secret Key'],
    whatHappensAfter: ['Approved loans trigger a transfer request to the borrower\'s account', 'Transfer status is tracked and shown on the loan record', 'Failed transfers can be retried from the loan details view'],
    fields: [{ key: 'publicKey', label: 'Public Key' }, { key: 'secretKey', label: 'Secret Key' }],
  },
  {
    id: 'monicenta', name: 'Monicenta', initials: 'MC', color: '#C2185B',
    tags: ['marketplace'],
    whatItDoes: 'A lending marketplace that lists this product to a network of partner lenders and agents, expanding distribution beyond your own portal.',
    whatYouNeed: ['An approved Monicenta lender profile', 'Base URL, Lender Code, Username, Password, User Agent, and Agent login credentials'],
    whatHappensAfter: ['This product becomes visible to Monicenta\'s partner network', 'Agents can originate applications on your behalf', 'Marketplace-originated applications flow into your normal pipeline'],
    notes: 'Agent login credentials are separate from your main Monicenta account login.',
    fields: [{ key: 'baseUrl', label: 'Base URL' }, { key: 'lenderCode', label: 'Lender Code' }, { key: 'username', label: 'Username' }, { key: 'password', label: 'Password' }, { key: 'userAgent', label: 'User Agent' }, { key: 'agentUsername', label: 'Agent Login Username' }, { key: 'agentPassword', label: 'Agent login password' }],
  },
  {
    id: 'digisign', name: 'Digisign', initials: 'DS', color: '#4A4A4A',
    tags: ['signature'],
    whatItDoes: 'Captures a legally-binding digital signature on the loan offer letter before funds are disbursed.',
    whatYouNeed: ['A Digisign workplace account', 'API Key, Base URL, and Workplace ID'],
    whatHappensAfter: ['Borrowers are prompted to sign the offer letter digitally', 'A signed, timestamped copy is stored against the loan', 'Disbursement is blocked until signature is confirmed'],
    fields: [{ key: 'apiKey', label: 'API Key' }, { key: 'baseUrl', label: 'Base URL' }, { key: 'workplaceId', label: 'Workplace ID' }],
  },
];

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
  phone: string;
  amount: string;
  disbursedDate: string;
  outstanding: string;
  tenor: string;
  status: 'active' | 'overdue' | 'suspended';
}

interface CustomerRow {
  id: string;
  user: TableItemUser;
  phone: string;
  status: 'active' | 'dormant' | 'overdue';
  appliedAt: string;
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
  imports: [RouterLink, FormsModule, DecimalPipe, HiIconComponent, InfoPopoverComponent, ButtonComponent, ChartComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent, RoundTabsComponent, ModalComponent, SelectComponent, TabsComponent, ToastComponent, KpiCardComponent, EmptyStateComponent, CheckboxComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);

  activeTab: DetailTab = 'overview';
  statPeriod: 'today' | 'week' | 'month' | 'all' = 'month';

  // Icons (Hugeicons)
  readonly backIcon: IconData = ArrowLeft02Icon as IconData;
  readonly pauseIcon: IconData = PauseIcon as IconData;
  readonly moreIcon: IconData = MoreVerticalIcon as IconData;
  readonly linkIcon: IconData = Link04Icon as IconData;
  readonly copyIcon: IconData = Copy01Icon as IconData;
  readonly externalLinkIcon: IconData = ArrowUpRight01Icon as IconData;
  readonly targetIcon: IconData = Settings02Icon as IconData;
  readonly loanCountIcon: IconData = Cashier02Icon as IconData;
  readonly disbursementIcon: IconData = Money04Icon as IconData;
  readonly activeCustomersIcon: IconData = UserGroup03Icon as IconData;
  readonly alertIcon: IconData = AlertDiamondIcon as IconData;
  readonly identityIcon: IconData = IdentificationIcon as IconData;
  readonly incomeIcon: IconData = Money02Icon as IconData;
  readonly checkIcon: IconData = CheckmarkBadge01Icon as IconData;
  readonly chevronDownIcon: IconData = ArrowDown01Icon as IconData;
  readonly plugIcon: IconData = Plug01Icon as IconData;
  readonly marketplaceIcon: IconData = ShoppingBag01Icon as IconData;

  get overviewTabItems(): TabItem[] {
    const tabs: TabItem[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'performance', label: 'Performance' },
      { id: 'active-loans', label: this.isBnpl ? 'Purchases' : 'Loans' },
    ];
    if (this.isBnpl) tabs.push({ id: 'vendors', label: 'Vendors' });
    tabs.push(
      { id: 'eligibility', label: 'Customers' },
      { id: 'collections', label: 'Collections/Repayments' },
      { id: 'integrations', label: 'Integrations' },
    );
    return tabs;
  }

  moreMenuOpen = false;

  targetPeriod: 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly';
  targetsSet = false;
  readonly targets = {
    loanCount: { current: 0, target: 0 },
    disbursementAmount: { current: 0, target: 0 },
    activeCustomers: { current: 0, target: 0 },
  };

  readonly setupSteps = [
    { id: 'identity',  title: 'Identity verification setup', description: 'Setup the 2 identity verification channels you selected', done: false },
    { id: 'income',    title: 'Income verification setup',   description: 'Setup the 2 identity verification channels you selected', done: false },
    { id: 'deduction', title: 'Deduction Channel Setup',     description: 'Setup the 2 identity verification channels you selected', done: false },
  ];

  get pendingSetupCount() { return this.setupSteps.filter(s => !s.done).length; }

  /** Draft while setup is incomplete, regardless of the underlying live/deactivated flag. */
  get effectiveStatus(): ProductStatus {
    if (this.pendingSetupCount > 0) return 'draft';
    return this.product.status;
  }

  targetPct(current: number, target: number): number {
    return target ? Math.min(100, Math.round((current / target) * 100)) : 0;
  }

  // ── Set target modal ──
  showTargetModal = false;
  targetModalTab: 'loanCount' | 'disbursementAmount' | 'activeCustomers' = 'loanCount';
  readonly targetModalTabs: TabItem[] = [
    { id: 'loanCount', label: 'Loan Counts' },
    { id: 'disbursementAmount', label: 'Disbursement Amount' },
    { id: 'activeCustomers', label: 'Active Customers' },
  ];
  readonly frequencyOptions: SelectOption[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];
  targetForm: { frequency: string; loanCount: string; disbursementAmount: string; activeCustomers: string } = {
    frequency: 'monthly',
    loanCount: '',
    disbursementAmount: '',
    activeCustomers: '',
  };

  targetToastVisible = false;

  openTargetModal() {
    this.targetModalTab = 'loanCount';
    this.targetForm = {
      frequency: this.targetPeriod,
      loanCount: this.targets.loanCount.target ? String(this.targets.loanCount.target) : '',
      disbursementAmount: this.targets.disbursementAmount.target ? String(this.targets.disbursementAmount.target) : '',
      activeCustomers: this.targets.activeCustomers.target ? String(this.targets.activeCustomers.target) : '',
    };
    this.showTargetModal = true;
  }

  saveTarget() {
    (['loanCount', 'disbursementAmount', 'activeCustomers'] as const).forEach((key) => {
      const value = Number(this.targetForm[key]);
      if (value > 0) this.targets[key].target = value;
    });
    this.targetPeriod = this.targetForm.frequency as typeof this.targetPeriod;
    this.targetsSet = true;
    this.showTargetModal = false;
    this.targetToastVisible = true;
    setTimeout(() => (this.targetToastVisible = false), 3500);
  }

  productStats: ProductStats = {
    totalApplications: 0, approvalRate: 0, avgLoanSize: '₦0', activeLoans: 0,
    totalDisbursed: '₦0', collectionRate: 0, nplRate: 0,
  };

  // ── Performance KPI filter ──
  readonly perfFilterTabs: Tab[] = [
    { label: 'This week', value: 'thisWeek' },
    { label: 'Last week', value: 'lastWeek' },
    { label: 'This month', value: 'thisMonth' },
    { label: 'Custom', value: 'custom' },
  ];
  perfFilter: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'custom' = 'thisMonth';

  private readonly perfStatsByFilter: Record<string, ProductStats> = {
    thisWeek:  { totalApplications: 96,  approvalRate: 71, avgLoanSize: '₦58,400', activeLoans: 22,  totalDisbursed: '₦2,100,000', collectionRate: 95.1, nplRate: 2.4 },
    lastWeek:  { totalApplications: 88,  approvalRate: 74, avgLoanSize: '₦61,900', activeLoans: 19,  totalDisbursed: '₦1,940,000', collectionRate: 93.8, nplRate: 2.9 },
    thisMonth: { totalApplications: 412, approvalRate: 77, avgLoanSize: '₦64,200', activeLoans: 128, totalDisbursed: '₦18,400,000', collectionRate: 94.2, nplRate: 3.1 },
    custom:    { totalApplications: 412, approvalRate: 77, avgLoanSize: '₦64,200', activeLoans: 128, totalDisbursed: '₦18,400,000', collectionRate: 94.2, nplRate: 3.1 },
  };

  get displayedStats(): ProductStats {
    return this.pendingSetupCount > 0
      ? { totalApplications: 0, approvalRate: 0, avgLoanSize: '₦0', activeLoans: 0, totalDisbursed: '₦0', collectionRate: 0, nplRate: 0 }
      : this.perfStatsByFilter[this.perfFilter];
  }

  setPerfFilter(value: string) { this.perfFilter = value as typeof this.perfFilter; }

  // ── Disbursement chart filter ──
  readonly chartFilterTabs: Tab[] = [
    { label: '6 months', value: '6months' },
    { label: 'This year', value: 'thisYear' },
    { label: 'Custom', value: 'custom' },
  ];
  chartFilter: '6months' | 'thisYear' | 'custom' = '6months';

  private readonly disbursementSeriesByFilter: Record<string, { labels: string[]; disbursed: number[]; repaid: number[] }> = {
    '6months': {
      labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      disbursed: [10, 14, 12, 18, 16, 22],
      repaid: [7, 11, 10, 15, 14, 19],
    },
    thisYear: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      disbursed: [6, 10, 14, 12, 18, 16, 22],
      repaid: [4, 7, 11, 10, 15, 14, 19],
    },
    custom: {
      labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      disbursed: [10, 14, 12, 18, 16, 22],
      repaid: [7, 11, 10, 15, 14, 19],
    },
  };

  get disbursementLabels(): string[] {
    return this.disbursementSeriesByFilter[this.chartFilter].labels;
  }

  /** Grouped-bar series: 2 bars per month — Disbursed (₦ millions, blue) vs Repaid (₦ millions, green). */
  get disbursementSeries(): ChartSeries[] {
    const f = this.disbursementSeriesByFilter[this.chartFilter];
    return [
      { name: 'Disbursed', color: 'var(--color-blue)', data: f.labels.map((label, i) => ({ label, value: f.disbursed[i] })) },
      { name: 'Repaid', color: 'var(--color-success)', data: f.labels.map((label, i) => ({ label, value: f.repaid[i] })) },
    ];
  }

  get disbursementMax(): number {
    const f = this.disbursementSeriesByFilter[this.chartFilter];
    return Math.max(...f.disbursed, ...f.repaid);
  }

  setChartFilter(value: string) { this.chartFilter = value as typeof this.chartFilter; }

  loanStatusCount(status: ActiveLoanRow['status']): number {
    return this.activeLoans.filter((l) => l.status === status).length;
  }

  activeLoans: ActiveLoanRow[] = [];

  // ── Customers tab ──
  customers: CustomerRow[] = [];
  readonly customerFilterTabs: Tab[] = [
    { label: 'All customers', value: 'all' },
    { label: 'Active customers', value: 'active' },
    { label: 'Dormant customers', value: 'dormant' },
    { label: 'Overdue customers', value: 'overdue' },
  ];
  customerFilter: 'all' | 'active' | 'dormant' | 'overdue' = 'all';
  selectedCustomerIds = new Set<string>();

  setCustomerFilter(value: string) { this.customerFilter = value as typeof this.customerFilter; }

  get filteredCustomers(): CustomerRow[] {
    return this.customerFilter === 'all' ? this.customers : this.customers.filter((c) => c.status === this.customerFilter);
  }

  toggleCustomerSelected(id: string) {
    this.selectedCustomerIds.has(id) ? this.selectedCustomerIds.delete(id) : this.selectedCustomerIds.add(id);
  }

  private buildMockCustomers(): CustomerRow[] {
    const rows: { name: string; status: CustomerRow['status'] }[] = [
      { name: 'Akpan Akporigomayen', status: 'active' },
      { name: 'Bola Adebayo', status: 'active' },
      { name: 'Chika Okafor', status: 'overdue' },
      { name: 'Damilola Ojo', status: 'active' },
      { name: 'Efe Igbinovia', status: 'dormant' },
      { name: 'Funke Salako', status: 'dormant' },
    ];
    return rows.map((r, i) => ({
      id: `${this.productId}-C${(i + 1).toString().padStart(3, '0')}`,
      user: { name: r.name, email: r.name.toLowerCase().replace(/\s+/g, '.') + '@princepsfinance.com' },
      phone: `080${(30000000 + i * 1111111).toString().slice(0, 8)}`,
      status: r.status,
      appliedAt: 'Aug 29, 2024, 3:52:12 PM GMT',
    }));
  }

  // ── Integrations tab ──
  readonly allIntegrations = ALL_INTEGRATIONS;
  readonly integrationScopeTabs: Tab[] = [
    { label: 'Active on this loan', value: 'active' },
    { label: 'Marketplace', value: 'marketplace' },
  ];
  integrationScope: 'active' | 'marketplace' = 'active';
  /** Ids of integrations selected/connected for this specific product. */
  connectedIntegrationIds = new Set<string>(['remita-salary', 'mono']);

  infoIntegration: IntegrationDef | null = null;
  connectIntegrationTarget: IntegrationDef | null = null;
  credentialForm: Record<string, string> = {};
  integrationToastVisible = false;

  setIntegrationScope(value: string) { this.integrationScope = value as typeof this.integrationScope; }

  get activeIntegrations(): IntegrationDef[] {
    return this.allIntegrations.filter((i) => this.connectedIntegrationIds.has(i.id));
  }

  isIntegrationConnected(id: string): boolean { return this.connectedIntegrationIds.has(id); }

  openIntegrationInfo(integration: IntegrationDef) { this.infoIntegration = integration; }
  closeIntegrationInfo() { this.infoIntegration = null; }

  openConnectIntegration(integration: IntegrationDef) {
    this.infoIntegration = null;
    this.credentialForm = Object.fromEntries(integration.fields.map((f) => [f.key, '']));
    this.connectIntegrationTarget = integration;
  }
  closeConnectIntegration() { this.connectIntegrationTarget = null; }

  submitConnectIntegration() {
    if (!this.connectIntegrationTarget) return;
    const allFilled = this.connectIntegrationTarget.fields.every((f) => this.credentialForm[f.key]?.trim());
    if (!allFilled) return;
    this.connectedIntegrationIds.add(this.connectIntegrationTarget.id);
    this.connectIntegrationTarget = null;
    this.integrationToastVisible = true;
    setTimeout(() => (this.integrationToastVisible = false), 3500);
  }

  // ── "See more" row action dialog ──
  loanActionRow: ActiveLoanRow | null = null;

  openLoanActions(loan: ActiveLoanRow) { this.loanActionRow = loan; }
  closeLoanActions() { this.loanActionRow = null; }
  viewCustomer(loan: ActiveLoanRow) { this.closeLoanActions(); this.router.navigate(['/customers'], { queryParams: { q: loan.customer.name } }); }
  viewLoanDetails(loan: ActiveLoanRow) { this.closeLoanActions(); this.router.navigate(['/loans', loan.id]); }

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
      this.customers = this.buildMockCustomers();
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
      { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com', phone: '08034760349' },
      { name: 'Bola Adebayo', email: 'bola@princepsfinance.com', phone: '08123456780' },
      { name: 'Chika Okafor', email: 'chika@princepsfinance.com', phone: '08098765432' },
      { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com', phone: '08145678901' },
    ];
    const statuses: ActiveLoanRow['status'][] = ['active', 'active', 'overdue', 'active'];
    return names.map(({ phone, ...customer }, i) => ({
      id: `${this.productId}-L${(i + 1).toString().padStart(3, '0')}`,
      customer,
      phone,
      amount: `₦${(50 + i * 20).toLocaleString()},000`,
      disbursedDate: 'Jun ' + (i + 1) + ', 2026',
      outstanding: `₦${(30 + i * 15).toLocaleString()},000`,
      tenor: `${3 + i} months`,
      status: statuses[i],
    }));
  }

  editProduct() {
    this.router.navigate(['/products/create'], { queryParams: { id: this.productId } });
  }

  togglePublish() {
    if (this.pendingSetupCount > 0) return;
    const next: ProductStatus = this.product.status === 'live' ? 'deactivated' : 'live';
    this.productsService.setStatus(this.productId, next);
    this.product = { ...this.product, status: next };
  }

  toggleMoreMenu() { this.moreMenuOpen = !this.moreMenuOpen; }

  goBack() { this.router.navigate(['/products']); }

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

  linkCopiedToastVisible = false;

  copyLink() {
    navigator.clipboard.writeText(this.product.websiteLink).catch(() => {});
    this.linkCopiedToastVisible = true;
    setTimeout(() => (this.linkCopiedToastVisible = false), 3000);
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
