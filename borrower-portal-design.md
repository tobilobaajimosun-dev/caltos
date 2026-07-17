# Borrower Portal & Tracker — Design Direction

Scope: the borrower-facing `/apply` flow and the customer-facing `/track` + `/portal/repayments`
pages only. The admin SaaS dashboard keeps the direction in `design.md` — this file replaces that
one's guidance for the three public, non-lender-facing surfaces.

**Sourcing note**: I couldn't pull live 7Shifts screens — Mobbin returned a 403 (requires a paid
login I don't have), and 7Shifts isn't in Nicelydone's library. The visual direction below is
built from general knowledge of 7Shifts' brand (a well-documented, widely-referenced design in the
scheduling-SaaS space), not screenshots. The repayment-tracker structure, by contrast, **is**
sourced directly — I loaded `mandates.forfond.group`'s subscription portal and captured its actual
layout. Flag it if the 7Shifts direction doesn't match what you had in mind once you see it built;
that part is the part built on inference.

---

## Why change direction

The current borrower portal (Revolut/Cash App-inspired — dark-on-light fintech, single-column
step-through cards, purple/brand-color accents) is functionally solid but reads as a *consumer
fintech app*. The tracker/repayment pages inherited the admin dashboard's enterprise-SaaS table
style. Neither matches what a borrower — often on a low-end Android phone, filling this out between
tasks — actually wants: something that feels **approachable, fast, and low-pressure**, closer to a
consumer productivity tool than a bank. That's the 7Shifts quality worth borrowing: friendly over
formal, big legible type, generous whitespace, soft color instead of stark contrast.

---

## Visual language

| Attribute | Direction |
|---|---|
| Corner radius | Generous — 16–20px on cards, 12px on buttons/inputs, fully pill-shaped only for status badges. Rounder than the current 14–16px used in `apply-profile-flow`. |
| Background | Warm off-white (`--surface-raised`, already the app default) rather than stark white — cards sit on it as visually distinct raised surfaces, not the reverse. |
| Shadows | Soft, low-elevation (`0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.05)`) — avoid the current heavy `--shadow-cta` glow on primary buttons; confidence should come from color/type weight, not drop-shadow drama. |
| Type | Geist for headings stays, but pull weight down a notch from the current 700/800 hero numerals to 600/700 — bold-but-friendly, not shouting. DM Sans body stays. |
| Color | Keep the per-lender `brandColor` system (already wired via `--brand`), but the *default* fallback (no brand color set) should be a warm, optimistic tone rather than the current cool blue-purple — closer to 7Shifts' approachable palette. Status colors stay as-is (they're already soft-tinted, which is correct). |
| Iconography | Simple, single-weight line icons (already the app's pattern — keep it) but slightly larger/friendlier stroke width (1.75–2px vs. the current 1.5px) at borrower-facing sizes. |
| Imagery | Lean into it more than the current flow does — the product hero image, lender logo, and (new) borrower avatar/initials should all feel present and personal, not just functional. |

---

## Repayment Tracker — structure (sourced from Forfond)

Forfond's subscription-mandate portal is a clean, proven pattern for exactly this job. Adapting its
structure (not its copy) for Caltos:

### Header card
Icon badge + product name + one-line description + a status pill (top-right) — matches what
`track-loan`/`repayment-portal` already do (`.portal-eyebrow`/`.portal-title`), just needs the
rounder, softer card treatment above.

### Three-card info row
1. **Repayment Terms** (renamed from Forfond's "Billing Terms" — matches loan vocabulary): loan
   amount, with frequency + tenor as two sub-pills below it — same data `track-loan` already shows
   in its KPI row, just restructured into one card instead of four separate KPI tiles.
2. **Borrower** (renamed from "Subscriber"): avatar/initials, name, a "Verified" badge (ties to
   `bvnVerified`), email, phone.
3. **Virtual Account** (this is the requested change — replaces Forfond's dark "Payment Methods /
   Add New Card" card entirely, since Caltos collects repayments via mandate/deduction rails, not
   stored cards): show the borrower's disbursement/repayment virtual account — bank name, account
   number, account name — as a dark high-contrast card matching Forfond's visual treatment (it's a
   good pattern: the one card that should visually pop against the lighter surrounding cards). No
   "add new card" CTA; instead a "Copy account number" action, matching the product-detail page's
   existing copy-link pattern.

### Repayment Schedule (renamed from "Billing Schedule")
Same table shape Forfond uses — Date / Amount / Status / Action — but the **Action** column is
where the requested behavior changes:
- **Upcoming or failed installment** → **"Pay now"** button, opening a small confirm step: pay the
  full installment amount, or enter a custom amount (partial repayment) — covers "one-time
  repayment, or they select amount they want to repay."
- **Paid installment** → a plain "Paid" label (Forfond shows "Completed" as a disabled action-slot;
  a status badge reads cleaner here since it's not actually actionable).

### Liquidate section
Keep as its own clearly-separated block below the schedule (already exists in `track-loan` as
`.danger-zone`) — **"Liquidate now"** closes the loan by paying the full remaining balance in one
shot, distinct from "Pay now" on a single installment. Keep the existing confirm-modal pattern
(`app-confirm-modal`, danger styling) — that part doesn't need to change, just the entry point's
copy ("Liquidate now" is clearer than the current "Liquidate loan" button label sitting inside a
card also titled "Liquidate loan" — redundant).

### Payment/Repayment History
A second table below the schedule, mirroring Forfond's — completed AND failed attempts with
timestamp, amount, status, failure reason (when applicable), and a reference ID. `track-loan`
currently doesn't have this as a separate section (its schedule table conflates upcoming and past);
splitting them the way Forfond does — forward-looking schedule vs. backward-looking history — is
clearer and is the concrete structural change to make here.

### Mobile table handling
The current `overflow-x: auto` table (flagged as a known gap in `design.md`) should be replaced for
this redesign — Forfond's own table doesn't solve mobile particularly well either, so don't copy
that part. Below 640px, render the schedule/history as a vertical list of compact row-cards (date +
amount stacked, status pill trailing) instead of a horizontally-scrolling table. This is a genuine
UX improvement over both the current implementation and the reference.

---

## Borrower application flow — what changes vs. what doesn't

**Keep unchanged** (these are functional/informational, not stylistic):
- The 16-bucket stage order (about → get started → personal/contact/address → income verification
  → eligibility → type details → documents → offer → mandate → Caltos Verify → review → success).
- The audience-gated income-verification logic, eligibility clamping/recompute, offer accept/reject
  behavior, confetti trigger.

**Restyle**:
- Progress indicator: swap the current thin top progress bar + dot row for a friendlier step
  indicator — e.g. a segmented pill row with the current segment filled, closer to a "step 3 of 8"
  feel than a raw percentage bar.
- Cards/inputs: rounder corners (per the token table above), softer input borders, larger tap
  targets on mobile (44px minimum height already met — keep it, just soften the visual weight).
- CTA buttons: drop the heavy glow shadow; rely on solid brand-color fill + confident type weight.
- The "About this loan" intro card: lean harder into the product's imagery — bigger hero image,
  lender logo more prominent, less dense text (the current amount/tenor/interest summary table
  reads like a spec sheet; consider 2–3 short highlight chips instead — "Up to ₦500,000",
  "12 months", "5% flat" — with the full breakdown available on tap/expand rather than always shown).

---

## Data-model gaps — now fixed

1. **Default brand color** — still open, needs a decision: a specific warm fallback hex (or a
   short list to pick from) for products with no `brandColor` set. I've described the direction
   ("warm, optimistic") but need an actual value before building.

2. **Virtual account source** — ✅ fixed. `LoanApplication` now has `virtualAccountBank` /
   `virtualAccountNumber` / `virtualAccountName`, auto-generated once at loan creation
   (`LoansService.generateVirtualAccount()` — deterministic mock, "Providus Bank" + a 10-digit
   number derived from the loan's own unique ID, distinct from `salaryBankName`/`salaryBankAccount`
   which stays the borrower's own mandate account). `track-loan` now shows this in a dark
   high-contrast card with a working "Copy account number" action.

3. **Partial repayment ("Pay now" custom amount)** — ✅ fixed. Added `RepaymentRecord` (amount,
   date, method, reference, installment due-date) + `LoanApplication.repayments: RepaymentRecord[]`
   as the real ledger, and `LoansService.recordRepayment()` to append to it. `repayment-schedule.ts`
   now derives each installment's status (`paid` / `partial` / `overdue` / `upcoming`) from actual
   recorded payments instead of guessing off the due date. `track-loan`'s "Pay now" opens a small
   modal prefilled with the remaining balance (editable, so a partial amount works), and a new
   "Repayment history" table shows every recorded payment. "Liquidate now" (renamed from "Liquidate
   loan") still settles the whole loan in one shot via the existing status-based mechanism — it
   doesn't need per-installment records anyway.

**Net effect on scope**: the functional groundwork (virtual account, real repayment ledger, working
"Pay now") is done and live on `track-loan`, using the *current* visual style (not yet restyled to
the 7Shifts-inspired direction described above). What's left is purely the visual restyle — tokens,
corner radii, card layout, the friendlier progress indicator, mobile row-cards instead of a
horizontally-scrolling table — plus the still-open default-brand-color decision. That's now a
contained, lower-risk pass since it's layering a new look onto already-working data, not building
both at once.
