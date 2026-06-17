import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoanConfig } from '../loans/create-loan/create-loan.component';

// Default fallback config (salary advance) used when no published product is in localStorage
const FALLBACK_CONFIG: LoanConfig = {
  template: 'salary',
  name: 'Salary Advance Loan',
  description: 'Quick access to earned wages for private sector employees.',
  targetAudiences: ['Salary Earners'],
  minAmount: '10000', maxAmount: '500000',
  minTenor: '1', maxTenor: '12', tenorUnit: 'Months',
  interestModel: 'Flat Rate', interestRate: '2.5',
  minAge: '18', maxAge: '',
  entryPhone: true, entryEmail: true, entryBvn: false, entryNin: false,
  collectPersonal: true, collectContact: true, collectAddress: false,
  collectEmployment: true, collectBusiness: false,
  allowContinue: true, recogniseExisting: true,
  identityBvn: true, identityNin: false, identityPhoneOtp: true, identityEmailOtp: false,
  incomeRemita: true, incomeIppis: false, incomeBankStatement: true,
  docGovId: 'required', docUtilityBill: 'optional', docWorkVerification: 'required',
  docGuarantorForm: 'none', docSchoolId: 'none', docAdmissionLetter: 'none',
  docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none',
  processingFeeType: 'Percentage', processingFeeRate: '1.5',
  processingFeeApplicableTo: 'Loan Amount', processingFeeMin: '', processingFeeMax: '',
  latePenaltyMethod: 'Percentage', latePenaltyRate: '2', latePenaltyGraceDays: '3',
  latePenaltyApplyTo: 'Outstanding Balance',
  disburseTo: 'bank', disburseTiming: 'instant',
  offerLetter: false, namedAccountOnly: true, repaymentDeductionFirst: false,
  videoConfirmation: false, autoDisburseEnabled: false, autoDisburseUnder: '',
  repaymentFrequency: 'Monthly', firstRepaymentDays: '30', repaymentDay: 'Day 30',
  minRepayments: '', maxRepayments: '', moveFirstRepaymentDays: '',
  docTerms: '', docPrivacy: '', docAgreement: '', useDefaultConsent: true,
  welcomeMessage: 'Welcome! Get quick access to your salary in advance. The process takes about 5 minutes.',
  thankYouMessage: '', supportEmail: 'hello@caltos.ng', supportPhone: '', whatsappContact: '',
  brandColor: '#6941C6', brandName: '',
};

interface StepDef { id: string; label: string; }

interface DocField {
  key: keyof LoanConfig;
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

  // ── Product config ──────────────────────────────────────────────────────────
  product!: LoanConfig;
  configSource: 'localStorage' | 'fallback' = 'fallback';

  // ── Dynamic steps ───────────────────────────────────────────────────────────
  steps: StepDef[] = [];
  stepIndex = 0;
  submitted = false;
  readonly refNumber = 'CLT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

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

  // ── Load config from localStorage ───────────────────────────────────────────
  private loadProduct() {
    try {
      const raw = localStorage.getItem('caltos_published_config');
      if (raw) {
        this.product = { ...FALLBACK_CONFIG, ...JSON.parse(raw) };
        this.configSource = 'localStorage';
      } else {
        this.product = FALLBACK_CONFIG;
        this.configSource = 'fallback';
      }
    } catch {
      this.product = FALLBACK_CONFIG;
      this.configSource = 'fallback';
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

    const needsIdentity = p.identityBvn || p.identityNin || p.identityPhoneOtp;
    if (needsIdentity) steps.push({ id: 'identity', label: 'Verify identity' });

    const hasIncome = p.incomeRemita || p.incomeIppis || p.incomeBankStatement;
    if (hasIncome) steps.push({ id: 'income', label: 'Verify income' });

    if (this.docFields.length) steps.push({ id: 'documents', label: 'Documents' });

    steps.push({ id: 'review', label: 'Review' });
    this.steps = steps;
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

  submit() { this.submitted = true; }

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
