/**
 * Plain-language, borrower-facing copy per repayment rail — the profile-driven /apply flow never
 * shows internal rail names (IPPIS, WACS, Dedukt, etc.) to a borrower, only this copy.
 */
export const MANDATE_RAIL_COPY: Record<string, { heading: string; description: string }> = {
  ippis: {
    heading: 'Authorise automatic repayment from your salary',
    description: 'Your monthly repayment will be deducted directly from your federal government salary before it reaches your account.',
  },
  wacs: {
    heading: 'Authorise automatic repayment from your salary',
    description: 'Your monthly repayment will be deducted directly from your state government salary before it reaches your account.',
  },
  remita: {
    heading: 'Authorise automatic repayment from your salary',
    description: 'Your monthly repayment will be deducted directly from your salary before it reaches your account.',
  },
  dedukt: {
    heading: 'Authorise automatic repayment from your salary',
    description: 'Your monthly repayment will be deducted directly from your salary before it reaches your account.',
  },
  'remita-direct-debit': {
    heading: 'Authorise a direct debit from your bank account',
    description: 'Your monthly repayment will be debited directly from the bank account you provide below.',
  },
  'mono-direct-debit': {
    heading: 'Authorise a direct debit from your bank account',
    description: 'Your monthly repayment will be debited directly from the bank account you provide below.',
  },
};

export const DEFAULT_MANDATE_COPY = {
  heading: 'Authorise your repayment mandate',
  description: 'Set up how your monthly repayment will be collected.',
};
