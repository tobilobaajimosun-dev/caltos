# Caltos Borrower Design System — "Revolut Business" Direction

The design north star for all **borrower-facing surfaces** — the repayment portal
(`/portal/repayments`), the public product catalogue (`/products/catalogue`), and any future
borrower touchpoint. Derived from Revolut Business's web app: calm, financial-grade,
friendly, and conversion-focused.

Admin SaaS dashboard conventions live in `CLAUDE.md` (component API + tokens) — the admin
surface intentionally diverges from this file.

---

## Design Principles

1. **Cards float, they don't sit in boxes.** White surfaces on a soft grey canvas.
   No borders. No heavy shadows. Radius does the work.
2. **Money is the hero.** Balances and rates render big, bold, and tight-tracked.
   Everything else supports the number.
3. **Pills everywhere.** Buttons, chips, filters, status — fully rounded (100px).
   Nothing square-cornered except cards.
4. **One accent, used sparingly.** Indigo for actions and highlights. Tinted lavender
   for secondary chips. Everything else is greyscale.
5. **Friendly, never corporate.** Copy talks like a helpful human ("You're 30% through
   your loan"), icons sit in soft tinted circles, empty states encourage.
6. **Conversion first (catalogue).** Trust signals up top, one obvious CTA per card,
   friction-reducing microcopy under every action.

---

## Tokens

### Canvas & surfaces

| Token | Value | Use |
|---|---|---|
| Page background | `#f6f6f8` | Every borrower page — never pure white |
| Surface | `#ffffff` | Cards, panels, modals, active nav item |
| Surface hover | `#fafafb` | Row hover inside cards |
| Hairline | `#f0f0f2` | Dividers inside cards — 1px, and only *inside* cards |

**No card borders. No card shadows at rest.** An optional hover lift
(`translateY(-2px)` + `0 8px 24px rgba(23,24,28,0.08)`) is allowed on interactive cards
(catalogue product cards) only.

### Brand & accents

| Token | Value | Use |
|---|---|---|
| Accent (indigo) | `#4f55f1` | Primary buttons, active pills, links, icons |
| Accent hover | `#3b41d8` | Primary button hover |
| Accent tint (lavender) | `#e9eafc` | Chip backgrounds, icon circles, secondary buttons |
| Success | `#12813d` on `#e7f6ec` | Paid, collected, trust chips |
| Error | `#d13030` on `#fdecec` | Failed payments, errors |
| Warning | `#b45309` on `#fdf3e0` | BNPL tint, overdue |

### Text

| Token | Value | Use |
|---|---|---|
| Primary | `#17181c` | Headings, values, money |
| Secondary | `#8b8f9a` | Labels, captions, timestamps |
| On-accent | `#ffffff` | Text on indigo |

### Type scale (DM Sans everywhere on borrower surfaces)

| Size | Weight | Use |
|---|---|---|
| 32px | 800 | Hero money figure (portal balance) |
| 26px | 800 | Page titles ("Home", "Loan products") |
| 40px | 800 | Catalogue rate hero |
| 16px | 700 | Card titles |
| 14px | 600 | Row titles, buttons, values |
| 13px | 400/500 | Body, chips, inputs |
| 12px | 500 | Captions, timestamps, microcopy |
| 11px | 700 | Eyebrow labels (uppercase, 0.06em tracking) |

Tracking: `-0.02em` to `-0.04em` on anything ≥ 20px. Money figures always 700–800 weight.

---

## Components

### Primary button ("Revolut pill")
- Height 44–48px, `border-radius: 100px`, background `#4f55f1`, white 14px/700 text
- Full-width inside cards and gates; hug-content elsewhere
- Hover `#3b41d8`; active `scale(0.99)`

### Chip button (signature element)
- Height 32px, `border-radius: 100px`, background `#e9eafc`, text `#4f55f1` 13px/600
- Optional 14px leading icon (`+`, download, copy)
- Used for every secondary action: "Add money"-style rows of 2–4 chips under a hero figure
- Hover: darken tint to `#dddffa`

### Icon circle
- 36–40px circle, tinted background (`#e9eafc` default, green/red/amber tints for status)
- 16–18px stroke icon in the tint's text colour, centred
- Leads every list row: transactions, documents, schedule entries

### List row (replaces tables on borrower surfaces)
- `icon circle | title (14px/600) + caption (12px grey) | right-aligned value`
- 14–16px vertical padding, hairline divider between rows, no divider after last
- Failed amounts render struck-through grey; credits may render green
- Row hover `#fafafb` when clickable

### Key-value row (detail cards)
- Label 13px `#8b8f9a` left · value 13px/600 `#17181c` right
- 12–14px vertical padding, hairline dividers

### Status pill
- 11px/700, pill radius, tinted bg + matching text (success/error/warning palette above)

### Nav (portal sidebar)
- Sits directly on the grey canvas — no panel background
- Items: 13px/500 grey, 10px radius, hover `#ececef`
- **Active item = floating white card** (white bg, subtle `0 1px 4px rgba(23,24,28,0.06)`),
  text `#17181c`/600, icon indigo

### Filter pills (catalogue)
- Rest: white pill, no border, 13px/500 `#595e6a`
- Active: `#17181c` bg (near-black), white text — count badge inverts
- Horizontal scroll, no scrollbar

### Inputs
- Background `#f0f0f3`, no border, `border-radius: 12px` (search: 100px), 13px
- Focus: white bg + 2px `#4f55f1` ring
- Placeholder `#a0a4ae`

### Modals & side panels
- White, `border-radius: 20px`, float over dimmed canvas
- Title 20px/800 left-aligned; full-width pill primary button pinned at bottom

---

## Page recipes

### Repayment portal (`/portal/repayments`)
- **Gate**: centred 420px white card (radius 24px) on grey; lavender icon circle,
  friendly title, one input, one indigo pill button, lock-microcopy below
- **Shell**: minimal top bar (brand left, avatar right, transparent) · sidebar ·
  content (max 720px) · chat panel as floating white card
- **Home**: page title → **hero balance card** (eyebrow label, 32px balance, chip-row
  of actions, progress bar with friendly caption) → stat mini-cards → virtual account
  card (copy chip) → mandate key-value card → schedule as list rows
- **History**: export chips in header; transactions as list rows with status pills
- **Documents**: doc list rows with download chips; letter requests as rows with
  chip buttons → green "Request sent" confirmation

### Product catalogue (`/products/catalogue`)
- Minimal transparent nav (brand + "Contact us" chip)
- Friendly header: trust chip → title → one-line promise → proof stats
- Search pill + filter pills in one sticky toolbar
- **Product card**: icon circle + type chip → 40px rate hero → name + 2-line desc →
  key-value rows (amount, period) → audience/verification chips →
  full-width indigo pill CTA → trust microcopy ("No paperwork · Decision in 24 hrs")
- Card hover: lift + soft shadow (the one allowed shadow)

---

## Copy voice

- Address the borrower as "you"; celebrate progress ("4-month streak 🔥" energy, minus emoji)
- CTAs are verbs with payoff: "Apply in minutes", "Access my portal" — never "Submit"
- Every risky-feeling moment gets reassurance microcopy (BVN never stored, encryption, timing)
- Numbers before words: "24 hrs avg. disbursement", not "fast disbursement"
