# Caltos Design System

This is the design reference for Caltos — the visual language, component sizing standards, and UX
principles the product should stay consistent with. It complements `CLAUDE.md` (which documents
dev conventions and the component API table) with the *why* behind the sizing and layout rules.

---

## Typography

Two typefaces, loaded once and referenced everywhere via CSS custom properties — never hardcode a
`font-family`.

| Token | Typeface | Source | Use |
|---|---|---|---|
| `--font-heading` | **Geist** | self-hosted variable font (`public/fonts/Geist-Variable.woff2`, declared via `@font-face` at the top of `src/styles.scss`) | Headings, card/section titles, KPI values, brand name in the header |
| `--font-body` | **DM Sans** | Google Fonts (`src/index.html`) | Everything else — body copy, labels, buttons, table cells |

Geist is intentionally self-hosted (not Google Fonts) — don't add a second `@font-face` or Google
Fonts `<link>` for it; that just duplicates a font that already loads correctly.

**Weight**: use semi-bold (600), not bold (700), for header/card-title copy — Geist's 700 weight
reads as too heavy at UI sizes. DM Sans body copy uses 400/500/600/700 as loaded.

### Type scale

| Token | Size | Typical use |
|---|---|---|
| `--text-xs` | 11px | Eyebrow labels, badges, table meta |
| `--text-sm` | 13px | Secondary buttons, captions, table cells |
| `--text-base` | 14px | Primary buttons, default body copy |
| `--text-md` | 16px | Card/panel titles |
| `--text-lg` | 18px | Section headings |
| `--text-xl` | 22px | Page-level KPI values |
| `--text-2xl` | 28px | Page titles |
| `--text-3xl` | 36px | Hero/landing numerals |

**Known debt**: a codebase audit found ~570 hardcoded `font-size: Npx` declarations across ~54
component stylesheets that don't reference this scale (most commonly 13px/12px/11px/14px — values
that already exist as tokens, just typed by hand instead of referencing `var(--text-*)`). This
isn't a visual bug today since the hand-typed values mostly match the scale, but it means the
scale isn't actually enforced — a future retheme would require hunting down every hardcoded value.
Treat new code as scale-only; migrate hardcodes opportunistically when touching a file, same as the
existing raw-`<table>`-to-`app-table-item` migration policy in `CLAUDE.md`.

---

## Color tokens

Defined in `src/styles.scss`, overridden by `.dark` for dark mode — always reference the token, not
a hex value, so components adapt automatically:

```
--color-blue        primary action / brand accent
--color-stroke       borders, dividers
--color-input-stroke  form control borders (slightly darker than --color-stroke)
--surface-base / --surface-raised / --surface-overlay   surface hierarchy, light→dark
--text-primary / --text-secondary / --text-muted / --text-disabled
--color-success / --color-warning / --color-error / --color-info / --color-critical
  (+ *-bg variants for tinted badges/banners)
--color-focus-ring
```

Fixed hex values are only acceptable for: toggle-switch knobs (always white regardless of track
color), decorative gradients (e.g. the loan-product hero banner), and semantic status-accent colors
that must read identically in both themes.

---

## Spacing

8px-derived scale, always via `var(--space-N)`, never a raw pixel margin/padding on new layout code:

`--space-1` 4px · `--space-2` 8px · `--space-3` 12px · `--space-4` 16px · `--space-5` 20px ·
`--space-6` 24px · `--space-8` 32px · `--space-10` 40px · `--space-12` 48px

**Nesting rule**: a padded container's children should not also pad the same axis unless they're
independently placed outside that container. This exact bug shipped once (see "Alignment" below) —
double-check when nesting a padded wrapper (`.tab-body`, `.panel`, etc.) inside another padded
wrapper (`.content`, `.page-header`, etc.) that only one of them owns the horizontal inset.

---

## Buttons (`app-button`)

All button variants share one fixed height so a row of mixed variants always lines up:

| Variant | Height | Font size | Radius | Use |
|---|---|---|---|---|
| `primary` | 36px | 14px / 500 | 8px | Main page action |
| `dropdown` | 36px | 14px / 500 | 8px | Primary action with an attached menu |
| `secondary` | 36px | 13px | 8px | Secondary actions (not a pill — don't reintroduce `border-radius: 100px`) |
| `outline` | 36px | 13px | 8px | Tertiary / low-emphasis actions, sits next to `secondary`/`filter` |
| `filter` | 36px | 13px | 8px | Filter chips/dropdown triggers |
| `round` | 36×36px | — | 50% | Icon-only circular action |
| `back` | text-link, no fixed height | 13px | — | "← Back" navigation |
| `text` | text-link, no fixed height | 13px | — | Inline text action |

`outline` was previously rendering at the base 14px (inherited, unset) while its visual siblings
`secondary`/`filter` render at 13px — fixed so all three "quiet" variants read at the same weight.

Small buttons/dropdown triggers that sit on cards (e.g. a period selector like "Today ▾") should be
28–32px tall with 13px font — see `.period-btn` in `product-detail.component.scss` for the reference.

**Don't hand-roll a `<button>`** for anything that fits an existing variant — a codebase audit found
221 raw `<button>` elements across feature pages with bespoke one-off CSS. Some are legitimate
(tab-strip controls, row-menu triggers with unique layout needs); most should be `app-button` or
`app-icon-button`. When adding new UI, reach for the design-system button first.

---

## Modals (`app-modal`)

Three fixed widths, each capped so it never exceeds the viewport with 20px breathing room:

| Size | Max width | Use |
|---|---|---|
| `sm` | 480px | Single-purpose confirm/edit forms (default choice for most modals) |
| `md` (default) | 640px | Multi-field forms, multi-step wizards |
| `lg` | 880px | Content-heavy modals (settings panels with sub-sections) |

Always pass `size` explicitly rather than relying on the `md` default — it documents intent even
when `md` happens to be the right call. `.modal-body` has zero built-in horizontal padding by
design; every consumer wraps its content in its own `padding: 0 var(--space-6)` div.

---

## Layout & alignment

- Page content sits in a single padded container (`.content` in feature pages, `.page-header` +
  siblings via `_stub-pages.scss` elsewhere) — nested wrappers inside it should not repeat the
  horizontal padding, or elements at different nesting depths drift out of alignment with each
  other (e.g. a hero image nested one level deeper than a sibling back button ends up indented
  further right than it should be — this exact bug shipped on the product detail page and is now
  fixed by making `.tab-body` inherit `.content`'s horizontal inset instead of adding its own).
- Data tables are edge-to-edge per `CLAUDE.md`'s Data Tables convention: no card wrapper, no outer
  border/radius/shadow, single divider under the header and between rows.

---

## Applicant Profiles & Audience — how the borrower-simplification model works

The Applicant Profile / audience feature (loan-product wizard → Application step) is a **one-time
lender configuration**, not something borrowers interact with as a concept. For each applicant
profile, a lender picks one of 4 fixed audiences — **Public/Civil Servant, Salaried Worker, SME
Owner, Corper** — and that single choice auto-constrains which income-verification methods are even
selectable for that profile (e.g. Salaried Worker → Payslip/Bank statement only; Public/Civil
Servant → Remita/IPPIS-WACS only).

**Where the complexity lives**: at lender setup time, not borrower runtime.
- A lender serving one borrower type creates one profile, picks its audience once, and the borrower
  never sees a profile-picker screen — it's automatically skipped when there's only one profile.
- A lender serving multiple types creates one profile per type; borrowers then see a short
  "how do you earn?" picker (pre-existing screen, unrelated to this feature) before landing in a
  narrower, audience-appropriate flow.

**Net effect for the borrower**: fewer, more relevant choices — a civil servant is never shown
Payslip/Bank-statement options, a salaried worker is never shown Remita/WACS. The audience field is
what lets the app *stop asking* borrowers to self-select from options that don't apply to them, so
it serves the "dumb it down" goal rather than working against it.

Legacy products (created before this feature existed) are unaffected — their profiles have
`audience: null` and keep behaving exactly as before, with no re-configuration required.

---

## Mobile responsiveness

Breakpoint variables live in `src/styles.scss` (`$bp-sm: 640px`, `$bp-md: 1024px`, `$bp-lg: 1280px`,
`$bp-xl: 1440px`) but are SCSS-only (not exposed as CSS custom properties), so every component
media query currently hand-types its own raw pixel breakpoint rather than referencing these — keep
new breakpoints aligned to these same values (640/1024) for consistency even though there's no
compiler enforcement of it yet.

Current coverage:
- **Dashboard shell** (`HeaderComponent`, `SidebarComponent`): sidebar collapses to an off-canvas
  overlay below 1024px (hamburger trigger, backdrop-dismiss). Header collapses to icon-only search,
  hides the wallet-balance pill and "Give a loan" button below 640px — those stay reachable via the
  sidebar's Quick Actions and the Home dashboard's Wallet card respectively.
- **Feature/reference pages** (`_stub-pages.scss`, shared by loans/collections/reports-style list
  pages): KPI grids and report-card grids already reflow via `grid-template-columns:
  repeat(auto-fit, minmax(...))` — no media query needed for column count. Side padding now steps
  down from 32px to 16px below 640px.
- **Customer track portal** (`track-loan`, `repayment-portal`): header padding steps down below
  640px; the phone-lookup row and mandate-status row wrap instead of overflowing.
- **Borrower application flow** (`apply-flow-v2`, `apply-profile-flow`): already had a 480px
  breakpoint reducing headline size and OTP dialog width; v2's own additions (hero image, confetti
  layer) are fluid by construction (`aspect-ratio`/`position: fixed`) and need no extra handling.

**Known gap**: the repayment-schedule/repayment-history tables (`track-loan`, `repayment-portal`)
are wrapped in `overflow-x: auto` so they scroll rather than break the layout, but there's no visual
affordance hinting that they're scrollable, and the ISO date format (`2026-07-03`) wraps to 3 lines
in the narrow date column. A follow-up could shorten the date format on mobile and/or switch to a
card-based list below 640px instead of a scrolling table — flagged, not fixed, since it's a bigger
UX redesign than the alignment/overflow bugs fixed in this pass.

---

## Component reference

See `CLAUDE.md`'s Component Library section for the full prop/selector table (form controls,
buttons, navigation, data display, tables, settings, file handling, modals/overlays, design-system
primitives). This file covers *why* the sizes are what they are; that one covers *what* each
component's API is.
