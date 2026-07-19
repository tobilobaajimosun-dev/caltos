import { ChangeDetectionStrategy, Component } from '@angular/core';

export type ReleaseTag = 'New' | 'Improved' | 'Fixed';

export interface ReleaseEntry {
  date: string;
  tag: ReleaseTag;
  title: string;
  description: string;
  bullets?: string[];
  /** CSS gradient for the announcement banner art (Clerk-changelog style). */
  art: string;
  /** Short display line rendered inside the banner art. */
  artTitle: string;
}

@Component({
  selector: 'app-whats-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './whats-new.component.html',
  styleUrl: './whats-new.component.scss',
})
export class WhatsNewComponent {
  readonly entries: ReleaseEntry[] = [
    {
      date: 'July 14, 2026',
      tag: 'New',
      title: 'Public product catalogue',
      description:
        'Share your loan products with borrowers before they ever sign in. The new public catalogue page lists every active product with rates, tenor, and eligibility criteria — and links straight into the application flow.',
      bullets: [
        'Product images, rate hero, and eligibility chips per card',
        'Search and product-type filters',
        'One shareable link instead of individual product links',
      ],
      art: 'linear-gradient(120deg, #4f55f1 0%, #7b5ff2 55%, #b39cf8 100%)',
      artTitle: 'Product Catalogue',
    },
    {
      date: 'June 30, 2026',
      tag: 'New',
      title: 'Self-serve repayment portal',
      description:
        'Borrowers settle instalments themselves from a Revolut-style portal — full schedule, next payment, virtual account transfer, early liquidation, and official letters, with every payment reconciling automatically against the loan ledger.',
      bullets: [
        'BVN + OTP secure access',
        'Multiple loans per borrower with a loan picker',
        'Early liquidation with waived unearned interest',
      ],
      art: 'linear-gradient(120deg, #0d1f3c 0%, #1a3a6b 60%, #2d5aa8 100%)',
      artTitle: 'Repayment Portal',
    },
    {
      date: 'June 18, 2026',
      tag: 'New',
      title: 'Dark mode',
      description:
        'Caltos now ships with a full dark theme. Switch between Light and Dark from the Appearance section in your profile menu — your preference is remembered across sessions and applies to every page, including charts and tables.',
      art: 'linear-gradient(120deg, #17181c 0%, #2e2e38 60%, #4a4a58 100%)',
      artTitle: 'Dark Mode',
    },
    {
      date: 'June 5, 2026',
      tag: 'Improved',
      title: 'Eligibility calculator upgrades',
      description:
        'The eligibility calculator now factors in existing loan exposure and employer-verified income, and explains exactly which rule capped an offer. Results include a shareable breakdown you can attach to a manual review.',
      art: 'linear-gradient(120deg, #0053a6 0%, #2d7dd2 60%, #7fb8ee 100%)',
      artTitle: 'Eligibility Engine',
    },
    {
      date: 'May 22, 2026',
      tag: 'Fixed',
      title: 'BNPL vendor settlement accuracy',
      description:
        'Fixed an issue in vendor management where BNPL settlement summaries could double-count refunded orders, overstating amounts owed to vendors. Historical settlement reports have been recalculated — no action is needed on your side.',
      art: 'linear-gradient(120deg, #b45309 0%, #d97706 60%, #f5c26b 100%)',
      artTitle: 'Vendor Settlements',
    },
  ];
}
