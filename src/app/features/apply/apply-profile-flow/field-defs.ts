import { ApplicantFieldKey } from '../../../shared/services/products.service';

export type FieldInputType = 'text' | 'money' | 'select' | 'date';

/** Which v2 /apply screen a field belongs to, orthogonal to the legacy `group`. Drives the
 * personal/contact/address split (v2 buckets) and which fields render in the post-eligibility
 * type-details bucket (work/business). */
export type FieldScreenCategory = 'personal' | 'address' | 'work' | 'business';

export interface FieldDef {
  label: string;
  inputType: FieldInputType;
  placeholder?: string;
  options?: string[];
  group: 'work' | 'business';
  screenCategory: FieldScreenCategory;
}

/**
 * Drives the profile-driven /apply flow's generic field renderer (bucket 4 in v1; split across
 * the personal/address/type-details buckets in v2) — every key a lender can list in
 * ApplicantProfile.fieldsRequired must have an entry here.
 */
export const FIELD_DEFS: Record<ApplicantFieldKey, FieldDef> = {
  fullName: { label: 'Full name', inputType: 'text', placeholder: 'e.g. Ada Eze', group: 'work', screenCategory: 'personal' },
  dateOfBirth: { label: 'Date of birth', inputType: 'date', group: 'work', screenCategory: 'personal' },
  gender: {
    label: 'Gender', inputType: 'select', group: 'work', screenCategory: 'personal',
    options: ['Female', 'Male'],
  },
  employerName: { label: 'Employer name', inputType: 'text', placeholder: 'e.g. First Bank', group: 'work', screenCategory: 'work' },
  jobTitle: { label: 'Job title', inputType: 'text', placeholder: 'e.g. Branch Manager', group: 'work', screenCategory: 'work' },
  staffId: { label: 'Staff ID', inputType: 'text', placeholder: 'e.g. FBN-00123', group: 'work', screenCategory: 'work' },
  businessName: { label: 'Business name', inputType: 'text', placeholder: 'e.g. Aisha Foods Ltd', group: 'business', screenCategory: 'business' },
  businessCacNumber: { label: 'CAC number', inputType: 'text', placeholder: 'e.g. RC-1234567', group: 'business', screenCategory: 'business' },
  businessType: { label: 'Business type', inputType: 'text', placeholder: 'e.g. Retail', group: 'business', screenCategory: 'business' },
  businessAnnualRevenue: { label: 'Annual revenue', inputType: 'money', placeholder: 'e.g. 5,000,000', group: 'business', screenCategory: 'business' },
  businessRole: {
    label: 'Your role', inputType: 'select', group: 'business', screenCategory: 'business',
    options: ['Owner', 'Director', 'Chairman'],
  },
  monthlyIncome: { label: 'Monthly net income (₦)', inputType: 'money', placeholder: 'e.g. 250,000', group: 'work', screenCategory: 'work' },
  addressStreet: { label: 'Street address', inputType: 'text', placeholder: 'e.g. 14 Marina Road', group: 'work', screenCategory: 'address' },
  addressCity: { label: 'City', inputType: 'text', group: 'work', screenCategory: 'address' },
  addressState: { label: 'State', inputType: 'text', group: 'work', screenCategory: 'address' },
};
