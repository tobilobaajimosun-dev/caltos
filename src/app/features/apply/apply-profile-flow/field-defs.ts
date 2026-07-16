import { ApplicantFieldKey } from '../../../shared/services/products.service';

export type FieldInputType = 'text' | 'money' | 'select';

export interface FieldDef {
  label: string;
  inputType: FieldInputType;
  placeholder?: string;
  options?: string[];
  group: 'work' | 'business';
}

/**
 * Drives the profile-driven /apply flow's generic field renderer (bucket 4) — every key a
 * lender can list in ApplicantProfile.fieldsRequired must have an entry here.
 */
export const FIELD_DEFS: Record<ApplicantFieldKey, FieldDef> = {
  employerName: { label: 'Employer name', inputType: 'text', placeholder: 'e.g. First Bank', group: 'work' },
  jobTitle: { label: 'Job title', inputType: 'text', placeholder: 'e.g. Branch Manager', group: 'work' },
  staffId: { label: 'Staff ID', inputType: 'text', placeholder: 'e.g. FBN-00123', group: 'work' },
  businessName: { label: 'Business name', inputType: 'text', placeholder: 'e.g. Aisha Foods Ltd', group: 'business' },
  businessCacNumber: { label: 'CAC number', inputType: 'text', placeholder: 'e.g. RC-1234567', group: 'business' },
  businessType: { label: 'Business type', inputType: 'text', placeholder: 'e.g. Retail', group: 'business' },
  businessAnnualRevenue: { label: 'Annual revenue', inputType: 'money', placeholder: 'e.g. 5,000,000', group: 'business' },
  businessRole: {
    label: 'Your role', inputType: 'select', group: 'business',
    options: ['Owner', 'Director', 'Chairman'],
  },
  monthlyIncome: { label: 'Monthly net income (₦)', inputType: 'money', placeholder: 'e.g. 250,000', group: 'work' },
  addressStreet: { label: 'Street address', inputType: 'text', placeholder: 'e.g. 14 Marina Road', group: 'work' },
  addressCity: { label: 'City', inputType: 'text', group: 'work' },
  addressState: { label: 'State', inputType: 'text', group: 'work' },
};
