import { ApplicantFieldKey, ApplicantProfile, RequiredDocumentSpec, IncomeVerificationSource, AudienceCategory } from '../../../shared/services/products.service';
import { LoanConfig } from '../../loans/create-loan/create-loan.component';

/** Maps a wizard template id straight to its audience — every audience-linked template preset
 * (see TEMPLATE_PRESETS in create-loan.component.ts) already sets config.audience directly for
 * products saved from now on, so this only matters for products created before that field existed. */
const TEMPLATE_AUDIENCE: Partial<Record<string, AudienceCategory>> = {
  salary: 'private-sector-worker',
  public: 'public-civil-servant',
  corper: 'corper',
  sme: 'sme-owner',
};

/**
 * Infers a v2-flow audience for products saved before the `audience` field existed, so they pick
 * up the redesigned borrower flow automatically rather than being permanently stuck on the legacy
 * one. Prefers the product's own template (a direct, unambiguous signal — see TEMPLATE_AUDIENCE);
 * falls back to the same per-type flags synthesizeDefaultProfile() already reads elsewhere in this
 * file. Lossy by nature (a product could plausibly fit more than one audience) — returns null when
 * no signal is confident enough, which keeps that product on the legacy flow rather than guessing
 * wrong and offering the wrong income-verification methods.
 */
function inferAudience(product: LoanConfig): AudienceCategory | null {
  if (product.audience) return product.audience;
  if (product.template && TEMPLATE_AUDIENCE[product.template]) return TEMPLATE_AUDIENCE[product.template]!;
  if (product.collectNyscInfo) return 'corper';
  if (product.collectCivilServiceInfo || product.incomeIppis) return 'public-civil-servant';
  if (product.collectBusiness && product.incomeBankStatement) return 'sme-owner';
  if (product.incomeBankStatement && product.collectEmployment) return 'private-sector-worker';
  if (product.incomeRemita) return 'public-civil-servant';
  return null;
}

const DOC_FIELD_MAP: { key: keyof LoanConfig; label: string }[] = [
  { key: 'docGovId', label: 'Government-issued ID' },
  { key: 'docUtilityBill', label: 'Utility bill' },
  { key: 'docWorkVerification', label: 'Work verification' },
  { key: 'docGuarantorForm', label: 'Guarantor form' },
  { key: 'docSchoolId', label: 'School ID' },
  { key: 'docAdmissionLetter', label: 'Admission letter' },
  { key: 'docNyscLetter', label: 'NYSC call-up letter' },
  { key: 'docCacCert', label: 'CAC certificate' },
  { key: 'docMembershipCert', label: 'Membership certificate' },
  { key: 'docMembershipId', label: 'Membership ID card' },
];

const MANDATE_RAIL_PRIORITY = ['ippis', 'remita', 'dedukt', 'wacs', 'remita-direct-debit', 'mono-direct-debit'];

/**
 * Builds a single ApplicantProfile on the fly for any product created before applicantProfiles
 * existed (every pre-session product has an empty array). Reads the same per-type fields the
 * old per-loan-type flow (apply.component.ts, now retired) used to read, so existing products
 * keep working through the universal 9-bucket engine without lenders reconfiguring anything.
 */
export function synthesizeDefaultProfile(product: LoanConfig): ApplicantProfile {
  const incomeVerificationSource: IncomeVerificationSource = product.incomeIppis ? 'wacs'
    : product.incomeRemita ? 'remita'
    : product.incomeBankStatement ? 'bank-statement'
    : 'business-revenue';

  const fieldsRequired: ApplicantFieldKey[] = [];
  if (product.collectEmployment || (!product.collectEmployment && !product.collectBusiness)) {
    fieldsRequired.push('employerName', 'jobTitle', 'staffId', 'monthlyIncome');
  }
  if (product.collectBusiness) {
    fieldsRequired.push('businessName', 'businessCacNumber', 'businessType', 'businessAnnualRevenue', 'businessRole');
  }
  if (!fieldsRequired.includes('monthlyIncome')) fieldsRequired.push('monthlyIncome');

  const requiredDocuments: RequiredDocumentSpec[] = DOC_FIELD_MAP
    .filter((d) => product[d.key] !== 'none')
    .map((d) => ({ key: d.key, label: d.label, captureMethod: 'upload' }));

  const rec = product as unknown as Record<string, string>;
  (product.customDocs ?? []).forEach((doc, i) => {
    const key = `custom-${i}`;
    if (rec[key] === 'none') return;
    requiredDocuments.push({ key, label: doc.name, captureMethod: 'upload' });
  });

  if (product.videoConfirmation) {
    requiredDocuments.push({ key: 'videoConfirmation', label: 'Video confirmation', captureMethod: 'in_app_recording' });
  }

  const enabled: Record<string, boolean> = {
    ippis: product.deductIppis, remita: product.deductRemita, dedukt: product.deductDedukt,
    wacs: product.deductWacs, 'remita-direct-debit': product.deductRemitaDirectDebit, 'mono-direct-debit': product.deductMonoDirectDebit,
  };
  const mandateRail = MANDATE_RAIL_PRIORITY.find((id) => enabled[id]) ?? 'remita';

  return {
    profileId: 'default',
    label: product.name || 'Applicant',
    incomeVerificationSource,
    audience: inferAudience(product),
    fieldsRequired,
    requiredDocuments,
    mandateRail,
    mandateTiming: 'post_approval',
  };
}
