# UI Components

Living reference for shared-component design decisions that aren't obvious from the code alone. Add a section here whenever a component's visual spec comes from a Figma/design reference, so future changes stay faithful to it instead of drifting per-page.

## Modal (`ModalComponent` / `app-modal`)

Source of truth: Figma "Balance Notification Settings" modal.

**Inputs:** `isOpen`, `title`, `size: 'sm' | 'md' | 'lg'` (420px / 520px / 720px max-width — pick the smallest one that fits the content instead of stretching a short confirm dialog to `lg`).
**Outputs:** `closed`.

**Slots:**
- Default (`<ng-content>`) — the body. The modal does not apply its own horizontal padding here; each consumer owns its body padding since bodies vary a lot (a plain message vs. a dense form). Wrap your content and set `padding: var(--space-6)` (or similar) yourself.
- `[modalFooter]` — optional footer row, right-aligned actions, separated by a top border. Project a single wrapper element with the `modalFooter` attribute:
  ```html
  <app-modal [isOpen]="isOpen" title="..." size="sm" (closed)="close()">
    <p style="padding: var(--space-6)">Are you sure?</p>
    <div modalFooter style="display:flex; gap: var(--space-3)">
      <app-button variant="outline" label="Cancel" (clicked)="close()" />
      <app-button variant="primary" label="Confirm" (clicked)="confirm()" />
    </div>
  </app-modal>
  ```
  If nothing is projected into `[modalFooter]`, the footer collapses to nothing (no empty border) — safe to omit for modals with no footer actions.

**Known exception:** `AddEditCustomerModalComponent` (`src/app/features/customers/add-edit-customer-modal/`) intentionally does not use `ModalComponent`. It's a multi-step wizard with its own step-indicator header and sticky footer — a genuinely different chrome pattern, not a plain modal with drifted styling. Don't force it onto `ModalComponent`; if the wizard chrome itself needs a redesign, treat that as its own task.

## Select (`SelectComponent` / `app-select`)

Source of truth: Figma currency-selector reference (single-option "NGN" pill).

**Inputs:** `options: SelectOption[]`, `value: string`.
**Outputs:** `valueChange`.

Replaces native `<select>` wherever the UI needs a trigger-button-plus-popover pattern (as opposed to a plain form `<select>` inside a longer form — those are left as native selects). When `options.length <= 1`, it renders as a static, non-interactive pill (no chevron, no click target) instead of a fake dropdown — this is how the NGN currency control on Home stays visually consistent without pretending there's a choice to make.
