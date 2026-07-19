import { ChangeDetectionStrategy, Component } from '@angular/core';

export type ReleaseTag = 'New' | 'Improved' | 'Fixed';

export interface ReleaseEntry {
  date: string;
  tag: ReleaseTag;
  title: string;
  description: string;
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
        'Share your loan products with borrowers before they ever sign in. The new public catalogue page lists every active product with rates, tenor, and eligibility criteria — and links straight into the application flow. Toggle catalogue visibility per product from the product detail page.',
    },
    {
      date: 'June 30, 2026',
      tag: 'New',
      title: 'Self-serve repayment portal',
      description:
        'Borrowers can now settle instalments themselves from a Revolut-style portal — view their full schedule, see what is due next, and pay by card or bank transfer without contacting your team. Every payment reconciles automatically against the loan ledger.',
    },
    {
      date: 'June 18, 2026',
      tag: 'New',
      title: 'Dark mode',
      description:
        'Caltos now ships with a full dark theme. Switch between Light and Dark from the Appearance section in your profile menu — your preference is remembered across sessions and applies to every page, including charts and tables.',
    },
    {
      date: 'June 5, 2026',
      tag: 'Improved',
      title: 'Eligibility calculator upgrades',
      description:
        'The eligibility calculator now factors in existing loan exposure and employer-verified income, and explains exactly which rule capped an offer. Results include a shareable breakdown you can attach to a manual review.',
    },
    {
      date: 'May 22, 2026',
      tag: 'Fixed',
      title: 'BNPL vendor settlement accuracy',
      description:
        'Fixed an issue in vendor management where BNPL settlement summaries could double-count refunded orders, overstating amounts owed to vendors. Historical settlement reports have been recalculated — no action is needed on your side.',
    },
  ];
}
