import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoanConfig } from '../loans/create-loan/create-loan.component';
import { LoansService } from '../../shared/services/loans.service';
import { ProductsService } from '../../shared/services/products.service';
import { scoreEligibility, EligibilityInput, EmploymentStabilityInput } from '../../shared/utils/eligibility-scoring';

// Default fallback config (salary advance) used when no published product is in localStorage
const FALLBACK_CONFIG: LoanConfig = {
  template: 'salary',
  name: 'Salary Advance Loan',
  description: 'Quick access to earned wages for private sector employees.',
  targetAudiences: ['Salary Earners'], audienceMode: 'custom',
  minAmount: '10000', maxAmount: '500000',
  minTenor: '1', maxTenor: '12', tenorUnit: 'Months',
  interestModel: 'Flat Rate', interestRate: '2.5', interestChargedWhen: 'Monthly',
  minAge: '18', maxAge: '',
  entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
  collectPersonal: true, collectContact: true, collectAddress: false,
  collectEmployment: true, collectBusiness: false, collectBank: false,
  allowContinue: true, recogniseExisting: true,
  identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
  incomeRemita: true, incomeIppis: false, incomeBankStatement: true,
  deductIppis: false, deductRemita: true, deductDedukt: false, deductWacs: false,
  deductRemitaDirectDebit: true, deductMonoDirectDebit: false,
  docGovId: 'required', docUtilityBill: 'optional', docWorkVerification: 'required',
  docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
  docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none',
  processingFeeType: 'Percentage', processingFeeRate: '1.5',
  processingFeeApplicableTo: 'Loan Amount', processingFeeMin: '', processingFeeMax: '',
  latePenaltyMethod: 'Percentage', latePenaltyRate: '2', latePenaltyGraceDays: '3',
  latePenaltyApplyTo: 'Outstanding Balance',
  latePenaltyChargeFrequency: 'Daily', latePenaltyApplicationTiming: 'During Loan Tenor',
  latePenaltyParallelAccrual: false, latePenaltyIncludeGraceInRecurring: false,
  latePenaltyAccrualStopCondition: 'Never',
  latePenaltyMaxCapEnabled: false, latePenaltyMaxCapChargeType: 'Percentage',
  latePenaltyMaxCapChargeValue: '', latePenaltyMaxCapChargeBase: 'Outstanding Balance',
  disburseTo: 'bank', disburseTiming: 'instant',
  offerLetter: false, namedAccountOnly: true, repaymentDeductionFirst: false,
  videoConfirmation: false, autoDisburseEnabled: false, autoDisburseUnder: '',
  restrictActiveLoan: false, activeLoanPolicy: 'block',
  repaymentFrequency: 'Monthly', firstRepaymentDays: '30', repaymentDay: 'Day 30',
  repaymentDayRangeStart: '28', repaymentDayRangeEnd: '31',
  minRepayments: '', maxRepayments: '', moveFirstRepaymentDayOfMonth: '',
  docTerms: '', docPrivacy: '', docAgreement: '', useDefaultConsent: true,
  welcomeMessage: 'Welcome! Get quick access to your salary in advance. The process takes about 5 minutes.',
  thankYouMessage: '', supportEmail: 'hello@caltos.ng', supportPhone: '', whatsappContact: '',
  brandColor: '#6941C6', brandName: '',
};

interface StepDef { id: string; label: string; }

interface DocField {
  key: string;
  label: string;
  sub: string;
  required: boolean;
}

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './apply.component.html',
  styleUrls: ['./apply.component.scss'],
})
export class ApplyComponent implements OnInit {
  Math = Math;

  private readonly loansService = inject(LoansService);
  private readonly productsService = inject(ProductsService);

  // ── Product config ──────────────────────────────────────────────────────────
  product!: LoanConfig;
  configSource: 'localStorage' | 'fallback' = 'fallback';
  /** Real ProductRecord id this application is filed against — the FK on LoanApplication. */
  resolvedProductId = '';

  // ── Dynamic steps ───────────────────────────────────────────────────────────
  steps: StepDef[] = [];
  stepIndex = 0;
  submitted = false;
  refNumber = 'CLT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // ── Computed from config ────────────────────────────────────────────────────
  amountMin = 10000;
  amountMax = 500000;
  tenorOptions: number[] = [];
  incomeOptions: { id: string; label: string; tag: string; desc: string; color: string }[] = [];
  docFields: DocField[] = [];

  // ── Form state: entry ───────────────────────────────────────────────────────
  entryPhone = '';
  entryEmail = '';
  entryBvn = '';
  entryNin = '';

  // ── Form state: loan details ────────────────────────────────────────────────
  loanAmount = '150000';
  loanTenor = '3';
  loanPurpose = '';

  // ── Form state: personal ────────────────────────────────────────────────────
  firstName = '';
  lastName = '';
  dob = '';
  gender = '';
  maritalStatus = '';

  // ── Form state: contact ─────────────────────────────────────────────────────
  phone = '';
  email = '';
  altPhone = '';

  // ── Form state: address ─────────────────────────────────────────────────────
  houseAddress = '';
  city = '';
  state = '';
  lga = '';

  // ── Form state: employment ──────────────────────────────────────────────────
  employerName = '';
  employmentType = '';
  monthlyIncome = '';
  staffId = '';

  // ── Form state: business ────────────────────────────────────────────────────
  businessName = '';
  cacNumber = '';
  businessType = '';
  annualRevenue = '';

  // ── Form state: bank account details ────────────────────────────────────────
  bankName = '';
  bankAccountNumber = '';
  bankAccountName = '';

  // ── Form state: per-section custom fields (item 11), keyed by field label ──
  customFieldValues: Record<string, string> = {};

  // ── Form state: identity ────────────────────────────────────────────────────
  bvn = '';
  nin = '';
  otpSent = false;
  otp = '';

  // ── Form state: income ──────────────────────────────────────────────────────
  incomeChannel = '';

  // ── Form state: documents ───────────────────────────────────────────────────
  uploadedDocs: Record<string, { file: File; name: string } | null> = {};

  readonly nigerianStates = [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
    'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
    'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
    'Yobe','Zamfara',
  ];

  ngOnInit() {
    this.loadProduct();
    this.buildDerivedData();
    this.buildSteps();
  }

  private readonly route = inject(ActivatedRoute);

  // ── Load config from localStorage, keyed by the ?product= query param ──────
  // Only a currently-'live' product's published snapshot is ever served here — a draft
  // edit only ever touches ProductRecord (via saveDraft), never this published-config key,
  // and if the product has since been deactivated/unpublished its stale snapshot must not
  // keep being served to real borrowers either, so status is re-checked on every load.
  private loadProduct() {
    const productId = this.route.snapshot.queryParamMap.get('product');
    const isLive = !!productId && this.productsService.getById(productId)?.status === 'live';
    try {
      const raw = productId && isLive ? localStorage.getItem(`caltos_published_config_${productId}`) : null;
      if (raw && productId) {
        this.product = { ...FALLBACK_CONFIG, ...JSON.parse(raw) };
        this.configSource = 'localStorage';
        this.resolvedProductId = productId;
      } else {
        this.product = FALLBACK_CONFIG;
        this.configSource = 'fallback';
        // No ?product= (or nothing published for it) — file the application against
        // whichever real product is live, so LoanApplication.productId is always a real FK.
        this.resolvedProductId = productId ?? this.productsService.products().find((p) => p.status === 'live')?.id ?? '';
      }
    } catch {
      this.product = FALLBACK_CONFIG;
      this.configSource = 'fallback';
      this.resolvedProductId = this.productsService.products().find((p) => p.status === 'live')?.id ?? '';
    }
  }

  // ── Derive amount/tenor/income/docs from config ─────────────────────────────
  private buildDerivedData() {
    const p = this.product;

    this.amountMin = +(p.minAmount || 10000);
    this.amountMax = +(p.maxAmount || 500000);
    // Start borrower at the midpoint
    this.loanAmount = String(Math.round((this.amountMin + this.amountMax) / 2 / 1000) * 1000);

    // Build tenor options based on configured range
    const minT = +(p.minTenor || 1);
    const maxT = +(p.maxTenor || 12);
    const presets = [1,2,3,6,9,12].filter(m => m >= minT && m <= maxT);
    this.tenorOptions = presets.length ? presets : [minT, maxT].filter((v,i,a) => a.indexOf(v) === i);
    this.loanTenor = String(this.tenorOptions[0] ?? minT);

    // Income options
    this.incomeOptions = [];
    if (p.incomeRemita)       this.incomeOptions.push({ id: 'remita', label: 'Remita',         tag: 'Instant', desc: 'For government & corporate employees', color: 'green' });
    if (p.incomeIppis)        this.incomeOptions.push({ id: 'ippis',  label: 'IPPIS',          tag: 'Instant', desc: 'Government payroll system',            color: 'blue' });
    if (p.incomeBankStatement) this.incomeOptions.push({ id: 'bank',  label: 'Bank Statement', tag: '3–6 hrs', desc: 'Upload a 3-month bank statement',      color: 'yellow' });
    if (this.incomeOptions.length) this.incomeChannel = this.incomeOptions[0].id;

    // Document fields — only those not 'none'
    const allDocs: { key: keyof LoanConfig; label: string; sub: string }[] = [
      { key: 'docGovId',           label: 'Government-issued ID',    sub: 'National ID · Voter\'s Card · Driver\'s Licence · Passport' },
      { key: 'docUtilityBill',     label: 'Utility bill',            sub: 'Recent (within 3 months) electricity, water or DSTV bill' },
      { key: 'docWorkVerification',label: 'Work verification',       sub: 'Employment letter, staff ID or company registration' },
      { key: 'docGuarantorForm',   label: 'Guarantor form',          sub: 'Signed form from an approved guarantor' },
      { key: 'docSchoolId',        label: 'School ID',               sub: 'Valid school identification card' },
      { key: 'docAdmissionLetter', label: 'Admission letter',        sub: 'Letter of admission from your institution' },
      { key: 'docNyscLetter',      label: 'NYSC call-up letter',     sub: 'Original NYSC call-up or posting letter' },
      { key: 'docCacCert',         label: 'CAC certificate',         sub: 'Certificate of incorporation for your business' },
      { key: 'docMembershipCert',  label: 'Membership certificate',  sub: 'Valid cooperative or association membership cert' },
    ];
    this.docFields = allDocs
      .filter(d => this.product[d.key] !== 'none')
      .map(d => ({ ...d, required: this.product[d.key] === 'required' }));

    // Custom documents added on the create-product wizard (item 14) — their required/
    // optional/none state is stored dynamically on the config under a `custom-{i}` key.
    const rec = this.product as unknown as Record<string, string>;
    (this.product.customDocs ?? []).forEach((doc, i) => {
      const key = `custom-${i}`;
      if (rec[key] === 'none') return;
      this.docFields.push({
        key,
        label: doc.name,
        sub: `Accepted formats: ${doc.types.join(', ')}`,
        required: rec[key] === 'required',
      });
    });

    // Pre-populate contact fields from entry if phone was used
    if (p.entryPhone && this.entryPhone) this.phone = this.entryPhone;
    if (p.entryEmail && this.entryEmail) this.email = this.entryEmail;
  }

  // ── Build step list based on config flags ───────────────────────────────────
  private buildSteps() {
    const p = this.product;
    const steps: StepDef[] = [{ id: 'welcome', label: 'Welcome' }];

    // Entry step — shown only if lender configured a specific entry method
    if (p.entryPhone || p.entryEmail || p.entryBvn || p.entryNin) {
      steps.push({ id: 'entry', label: 'Identify yourself' });
    }

    steps.push({ id: 'loan', label: 'Loan details' });

    if (p.collectPersonal)   steps.push({ id: 'personal',   label: 'Personal info' });
    if (p.collectContact)    steps.push({ id: 'contact',    label: 'Contact' });
    if (p.collectAddress)    steps.push({ id: 'address',    label: 'Address' });
    if (p.collectEmployment) steps.push({ id: 'employment', label: 'Employment' });
    if (p.collectBusiness)   steps.push({ id: 'business',   label: 'Business info' });
    if (p.collectBank)       steps.push({ id: 'bank',       label: 'Bank details' });

    const needsIdentity = p.identityBvn || p.identityNin || p.identityPhoneOtp;
    if (needsIdentity) steps.push({ id: 'identity', label: 'Verify identity' });

    const hasIncome = p.incomeRemita || p.incomeIppis || p.incomeBankStatement;
    if (hasIncome) steps.push({ id: 'income', label: 'Verify income' });

    if (this.docFields.length) steps.push({ id: 'documents', label: 'Documents' });

    steps.push({ id: 'review', label: 'Review' });
    this.steps = steps;
  }

  // Lender-defined custom fields (item 11) for a given collection section — e.g.
  // sectionFields('collectPersonal') for the extra fields added under Personal
  // Information on the create-product wizard.
  sectionFields(sectionKey: string): { label: string; type: string; required: string }[] {
    return this.product.sectionCustomFields?.[sectionKey] ?? [];
  }

  /**
   * BVN verification is an anchor rule — always required later in the flow — regardless of
   * whether this product's wizard configured entryBvn. If it wasn't collected at entry, the
   * applicant would otherwise be surprised by a BVN field appearing later at Verify Identity;
   * this shows them a heads-up on the entry step instead.
   */
  get showBvnEntryNotice(): boolean {
    return !this.product.entryBvn;
  }

  /** The lender's own brand color, driving every accent in this portal (CTA, progress, focus rings) — falls back to the original signature purple for products created before branding existed. */
  get brandColor(): string {
    return this.product.brandColor || '#7C5CEB';
  }

  // ── Step helpers ────────────────────────────────────────────────────────────
  get currentStep(): StepDef { return this.steps[this.stepIndex]; }

  get progress(): number {
    return (this.stepIndex / Math.max(this.steps.length - 1, 1)) * 100;
  }

  get isFirst(): boolean { return this.stepIndex === 0; }
  get isLast(): boolean  { return this.stepIndex === this.steps.length - 1; }

  next() {
    if (this.stepIndex < this.steps.length - 1) {
      this.stepIndex++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  back() {
    if (this.stepIndex > 0) {
      this.stepIndex--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Set when submit() is blocked by an in-progress duplicate application from this BVN. */
  duplicateBlockMessage: string | null = null;

  submit() {
    const applicantIdentifier = this.bvn || this.entryBvn;
    const duplicateReason = this.loansService.getDuplicateApplicationBlockReason(this.resolvedProductId, applicantIdentifier);
    if (duplicateReason) {
      this.duplicateBlockMessage = duplicateReason;
      return;
    }

    const customerName = `${this.firstName} ${this.lastName}`.trim() || 'Applicant';
    const phone = this.phone || this.entryPhone || this.altPhone;

    const stability: EmploymentStabilityInput = /nysc|corper|corps/i.test(this.employmentType)
      ? { type: 'nysc-corper', monthsRemaining: 9 }
      : { type: 'mda', category: 'private-large' };

    const eligibilityInput: EligibilityInput = {
      income: { source: (this.incomeChannel as 'ippis' | 'remita' | 'deduct') || 'other', monthlyAmount: +this.monthlyIncome || 0 },
      stability,
      repaymentHistory: { isRepeatBorrower: false },
      exposure: { hasActiveLoanElsewhere: false },
    };
    const eligibility = scoreEligibility(eligibilityInput);

    const requiredDocuments = this.docFields.map((d) => ({
      type: d.label,
      uploaded: !!this.getDoc(d.key),
      approved: false,
    }));

    const created = this.loansService.create({
      productId: this.resolvedProductId,
      applicantIdentifier,
      customerName,
      customerPhone: phone,
      customerEmail: this.email || this.entryEmail,
      customerPhoto: '',
      amount: +this.loanAmount,
      tenor: +this.loanTenor,
      interestRate: +(this.product.interestRate || 0),
      totalRepayment: this.totalRepayment,
      monthlyRepayment: this.monthlyEst,
      workplace: this.employerName,
      workplaceIdNumber: this.staffId,
      telephoneNumber: phone,
      salaryBankName: this.bankName,
      salaryBankAccount: this.bankAccountNumber,
      referralCode: this.route.snapshot.queryParamMap.get('ref') ?? '',
      status: 'new',
      verificationResults: {
        bvnVerified: /^\d{11}$/.test(this.bvn),
        secondaryCheckPassed: this.otpSent && !!this.otp,
        mismatchFlags: /^\d{11}$/.test(this.bvn) ? [] : ['BVN could not be validated — expected an 11-digit number.'],
      },
      eligibilityScore: {
        score: eligibility.score,
        maxEligibleAmount: eligibility.maxEligibleAmount,
        tenor: eligibility.tenorMonths,
      },
      requiredDocuments,
      deductionChannelStatus: this.loansService.buildDeductionChannelStatus(this.resolvedProductId),
      utmSource: this.route.snapshot.queryParamMap.get('utm_source') ?? 'direct',
      utmMedium: this.route.snapshot.queryParamMap.get('utm_medium') ?? 'organic',
    });

    this.refNumber = created.loanUniqueId;
    this.submitted = true;
  }

  // ── OTP ─────────────────────────────────────────────────────────────────────
  sendOtp() { this.otpSent = true; }

  // ── Documents ───────────────────────────────────────────────────────────────
  onFileChange(event: Event, key: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadedDocs = { ...this.uploadedDocs, [key]: { file, name: file.name } };
  }

  removeDoc(key: string) {
    this.uploadedDocs = { ...this.uploadedDocs, [key]: null };
  }

  getDoc(key: string) { return this.uploadedDocs[key] ?? null; }

  // ── Loan summary ────────────────────────────────────────────────────────────
  get monthlyEst(): number {
    return Math.ceil((+this.loanAmount * (1 + +(this.product.interestRate || 2.5) / 100)) / (+this.loanTenor || 1));
  }

  get totalRepayment(): number {
    return Math.ceil(+this.loanAmount * (1 + +(this.product.interestRate || 2.5) / 100));
  }

  get interestRateDisplay(): string {
    return `${this.product.interestRate || '2.5'}% / ${this.product.tenorUnit?.slice(0,-1).toLowerCase() || 'month'} (${this.product.interestModel || 'Flat Rate'})`;
  }
}
