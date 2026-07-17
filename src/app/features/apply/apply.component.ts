import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoanConfig } from '../loans/create-loan/create-loan.component';
import { ProductsService } from '../../shared/services/products.service';
import { OrgBrandingService } from '../../shared/services/org-branding.service';
import { ApplyProfileFlowComponent } from './apply-profile-flow/apply-profile-flow.component';
import { ApplyFlowV2Component } from './apply-flow-v2/apply-flow-v2.component';
import { synthesizeDefaultProfile } from './apply-profile-flow/default-profile';

// Default fallback config (salary advance) used when no published product is in localStorage
const FALLBACK_CONFIG: LoanConfig = {
  template: 'salary',
  name: 'Salary Advance Loan',
  description: 'Quick access to earned wages for private sector employees.',
  targetAudiences: ['Salary Earners'], audienceMode: 'custom', audience: null,
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
  docNyscLetter: 'none', docCacCert: 'none', docMembershipCert: 'none', docMembershipId: 'none',
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
  collectSchoolInfo: false, collectCoopInfo: false,
  collectCivilServiceInfo: false, collectNyscInfo: false,
  applicantProfiles: [],
};

/**
 * Resolves the product config for the ?product= query param and hands it to the universal
 * borrower-portal engine (ApplyProfileFlowComponent) — every product renders through the same
 * 9-bucket flow regardless of type.
 */
@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [ApplyProfileFlowComponent, ApplyFlowV2Component],
  templateUrl: './apply.component.html',
  styleUrls: ['./apply.component.scss'],
})
export class ApplyComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly orgBranding = inject(OrgBrandingService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Product config ──────────────────────────────────────────────────────────
  product: LoanConfig = FALLBACK_CONFIG;
  configSource: 'localStorage' | 'fallback' = 'fallback';
  resolvedProductId = '';

  get orgLogoDataUrl() { return this.orgBranding.branding().logoDataUrl; }

  /** v2 (redesigned) /apply flow runs once every applicant profile on this product has an
   * `audience` — either explicitly configured ones, or, for products with no Applicant Profiles
   * configured at all (most products created before this field existed), the single profile
   * default-profile.ts synthesizes on the fly. synthesizeDefaultProfile() infers an audience from
   * the product's template/legacy flags when one hasn't been set explicitly, so existing products
   * pick up the redesigned flow automatically rather than staying stuck on the legacy one forever. */
  get useV2Flow(): boolean {
    const profiles = this.product.applicantProfiles?.length
      ? this.product.applicantProfiles
      : [synthesizeDefaultProfile(this.product)];
    return profiles.every((p) => !!p.audience);
  }

  // True until loadProduct() finishes — the template's first render happens before this async
  // work resolves, so it renders a minimal shell instead of an empty/fallback product.
  loading = true;

  async ngOnInit() {
    try {
      await this.loadProduct();
    } catch (e) {
      console.error('ApplyComponent failed to initialize', e);
    } finally {
      this.loading = false;
      // This app runs zoneless — the continuation after `await` isn't an Angular-tracked
      // event, so nothing repaints the view on its own without an explicit nudge here.
      this.cdr.markForCheck();
    }
  }

  // ── Load config, keyed by the ?product= query param ─────────────────────────
  private async loadProduct() {
    await this.productsService.ready;
    const productId = this.route.snapshot.queryParamMap.get('product');
    try {
      const raw = productId ? await this.productsService.getPublishedConfig(productId) : undefined;
      const record = productId ? this.productsService.getById(productId) : undefined;
      if (raw && productId) {
        this.product = { ...FALLBACK_CONFIG, ...raw } as LoanConfig;
        this.configSource = 'localStorage';
        this.resolvedProductId = productId;
      } else if (record) {
        this.product = {
          ...FALLBACK_CONFIG,
          // Carry over the wizard's full legacy config (template, collectNyscInfo, incomeRemita,
          // etc.) when this product has one — synthesizeDefaultProfile()'s audience inference reads
          // these, so without this a wizard-created legacy product would fall back to
          // FALLBACK_CONFIG's generic defaults instead of its own actual signals.
          ...((record.wizardConfig as Partial<LoanConfig> | undefined) ?? {}),
          name: record.name,
          description: record.description,
          minAmount: record.minAmount.replace(/,/g, ''),
          maxAmount: record.maxAmount.replace(/,/g, ''),
          minTenor: record.minTenor,
          maxTenor: record.maxTenor,
          tenorUnit: record.tenorUnit,
          interestModel: record.interestType,
          interestRate: record.interestRate,
          interestChargedWhen: record.interestFrequency,
          bannerImageDataUrl: record.bannerImageDataUrl,
          applicantProfiles: record.config.applicantProfiles ?? [],
        };
        this.configSource = 'localStorage';
        this.resolvedProductId = productId!;
      } else {
        this.product = FALLBACK_CONFIG;
        this.configSource = 'fallback';
        this.resolvedProductId = productId ?? this.productsService.products().find((p) => p.status === 'live')?.id ?? '';
      }
    } catch {
      this.product = FALLBACK_CONFIG;
      this.configSource = 'fallback';
      this.resolvedProductId = this.productsService.products().find((p) => p.status === 'live')?.id ?? '';
    }
  }
}
