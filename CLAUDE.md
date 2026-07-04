# Caltos — Angular Component Library

Loan SaaS app. Angular 21 standalone components. Deployed at https://caltos-rho.vercel.app

## Stack
- Angular 21 standalone (no NgModules)
- SCSS with CSS custom properties
- No UI library — everything is custom-built
- Deploy: `git push` → auto-deploys to Vercel via GitHub

## Design Tokens (`src/styles.scss`)
```
--color-header: #121212      (page headings)
--color-body: #44444b        (body text)
--color-grey-header: #8a93a6 (labels, placeholders)
--color-blue: #0053a6        (primary action)
--color-stroke: #ecf0f3      (borders, dividers)
--color-grey: #bbbbcb        (inactive UI elements)
--color-input-stroke: #c0c9d1 (input borders)
--font-heading: 'Switzer'
--font-body: 'Euclid Circular B'

// Status colors
--color-success / --color-success-bg
--color-warning / --color-warning-bg
--color-error / --color-error-bg
--color-info / --color-info-bg

// Surface hierarchy
--surface-base / --surface-raised / --surface-overlay

// Text hierarchy (prefer these over --color-header/body/grey-header in new code)
--text-primary / --text-secondary / --text-muted / --text-disabled

// Interactive
--color-focus-ring

// Spacing scale: --space-1 (4px) through --space-12 (48px)
// Typography scale: --text-xs (11px) through --text-3xl (36px)
```

### Dark Mode
- Toggled via `ThemeService` (`src/app/shared/services/theme.service.ts`) — `theme.toggle()` / `theme.set(bool)` / `theme.isDark()` signal
- Applies/removes a `.dark` class on `<html>`, persisted to `localStorage`
- `.dark` overrides the surface/text/status tokens above — write new component styles against tokens (not hardcoded hex) so they adapt automatically
- Toggle UI currently lives in the sidebar; will move to Settings > Appearance and the header user menu once those are built

### Responsive Breakpoints (SCSS variables in `styles.scss`)
`$bp-sm: 640px`, `$bp-md: 1024px`, `$bp-lg: 1280px`, `$bp-xl: 1440px`. Sidebar becomes an off-canvas overlay below `$bp-md`, driven by `SidebarStateService` (`src/app/shared/services/sidebar-state.service.ts`).

## Component Library (`src/app/shared/components/`)
All components are exported from the barrel: `import { X } from './shared/components'`

### Form Controls
| Component | Selector | Key Inputs | Key Outputs |
|---|---|---|---|
| `InputComponent` | `app-input` | `value`, `placeholder`, `type`, `label`, `disabled` | `valueChange` |
| `SearchComponent` | `app-search` | `value`, `placeholder` | `valueChange`, `cleared` |
| `ToggleComponent` | `app-toggle` | `checked` | `checkedChange` |
| `CheckboxComponent` | `app-checkbox` | `checked`, `label`, `variant: 'square'|'round'` | `checkedChange` |
| `RadioButtonComponent` | `app-radio-button` | `selected`, `label` | `selectedChange` |

### Buttons
| Component | Selector | Key Inputs |
|---|---|---|
| `ButtonComponent` | `app-button` | `variant: 'primary'|'secondary'|'outline'|'back'|'filter'|'round'|'dropdown'|'text'`, `label`, `disabled`, `active`, `dark` |
| `IconButtonComponent` | `app-icon-button` | `icon: 'edit'|'check'|'close'|'delete'|'more'|'edit-open'|'info'|'view'|'expand'`, `color: 'default'|'blue'|'green'|'red'`, `label`, `filled` |

### Navigation
| Component | Selector | Key Inputs |
|---|---|---|
| `NavItemComponent` | `app-nav-item` | `label`, `icon: NavItemIcon`, `active`, `hasDropdown`, `expanded`, `variant: 'default'|'primary-text'` |
| `OrgProfileComponent` | `app-org-profile` | `orgName`, `avatarLetter`, `avatarColor`, `role` |
| `SidebarComponent` | `app-sidebar` | `orgName`, `activeItemId` (fallback only — active state is Router-driven), `walletBalance`, `lowBalanceThreshold` | `navChange` |
| `HeaderComponent` | `app-header` | — (org switcher, ⌘K search → command palette, help/notifications/user menus, dark mode toggle, sign out) | |
| `AppShellComponent` | `app-shell` | — wraps sidebar + header + breadcrumb + `<router-outlet>`; shows a skeleton during navigation | |

NavItemIcon values: `'dashboard'|'home'|'customers'|'wallet'|'products'|'loans'|'reports'|'risk'|'teams'|'settings'|'employers'|'quick-action'|'none'`

### App Shell & Routing (#14)
- `AppShellComponent` (`src/app/shared/components/app-shell/`) is the parent route component in `app.routes.ts` — every authenticated page is nested under it as a child route, so sidebar/header/breadcrumb render once instead of per-page.
- Excluded from the shell: `/apply` (public borrower-facing flow) and `/showcase` (self-contained component-library demo that renders its own sidebar).
- Sidebar active-item highlighting is derived from the current Router URL (longest route-prefix match); the `activeItemId` input is only a fallback for nav items without a real route (Customers, Wallet, Teams — pending their own feature issues).
- Unmatched routes fall through to `NotFoundComponent` (`src/app/pages/not-found/`) via a `**` wildcard route.
- Org identity lives only in the sidebar (`OrgProfileComponent`, single-line name truncated with an ellipsis + role badge below) — the header does not duplicate it. Clicking the org name opens a "Switch organization" dialog (built into `SidebarComponent` with `app-modal`); the header's user menu no longer has its own org switcher.
- Collapsed (icon-only) sidebar nav items show their label in an `app-tooltip` (`position="right"`) on hover/focus.
- The header has a direct sun/moon icon button for dark mode in addition to `ThemeService`; there's no separate wallet-balance indicator in the sidebar — wallet info lives on the Home dashboard card only.

### Authentication (#13)
- Routes (outside the shell, no sidebar/header): `/login`, `/forgot-password`, `/onboarding`, `/invite/:token`.
- `AuthLayoutComponent` (`app-auth-layout`) is the shared split-screen shell (form left, branded value-prop right) used by login, forgot-password, and accept-invite. It hides the right pane below 1024px. Onboarding uses its own full-width stepper layout instead, since its forms are wider.
- Shared form styling lives in `src/app/features/auth/_auth-forms.scss`, pulled in via `@use '../auth-forms'` — field/error/strength-meter/button classes are consistent across all auth screens.
- All auth forms use `ReactiveFormsModule` (`FormBuilder` + `Validators`), not `[(ngModel)]`.
- Login's 2FA step is always shown after valid credentials (demo OTP: `123456`); email `locked@princepsfinance.com` demos the invalid-credentials error state.
- `SessionService` (`src/app/shared/services/session.service.ts`) drives `SessionExpiredModalComponent`, mounted once in `AppShellComponent` so it can appear over any page without losing context. Trigger it via the header's user menu → "Simulate session expiry (demo)" — there's no real session/idle-timeout backend yet.

### Data Display
| Component | Selector | Key Inputs |
|---|---|---|
| `KpiCardComponent` | `app-kpi-card` | `label`, `value: string|number` |
| `StatusBadgeComponent` | `app-status-badge` | `status: 'active'|'inactive'|'suspended'|'pending'|'overdue'|'dormant'|'successful'|'failed'`, `label` |
| `HeaderPillComponent` | `app-header-pill` | `label`, `active` | `clicked` |
| `BadgeCardComponent` | `app-badge-card` | `title`, `description` | `actioned` |
| `ToastComponent` | `app-toast` | `type: 'success'|'error'`, `title`, `message` | `dismissed` |

### Table
| Component | Selector | Key Inputs |
|---|---|---|
| `ColumnTitleComponent` | `app-column-title` | `label`, `sortable`, `sorted: 'asc'|'desc'|null` | `sortChange` |
| `TableItemComponent` | `app-table-item` | `type: 'user-avatar'|'user'|'date'|'status'|'text'|'tags'|'amount'|'actions'|'more'`, `user`, `status`, `tags`, `amount`, `date`, `linkLabel` | |

### Settings & Permissions
| Component | Selector | Key Inputs |
|---|---|---|
| `SettingsRowComponent` | `app-settings-row` | `type: 'text'|'email'|'color'|'toggle'`, `label`, `subtitle`, `value`, `toggled` | `valueChange`, `toggleChange` |
| `PermissionChipComponent` | `app-permission-chip` | `label`, `active`, `removable` | `clicked`, `removed` |
| `PermissionGroupComponent` | `app-permission-group` | `groupName`, `permissions: PermissionItem[]`, `showCustomToggle`, `customEnabled` | `permissionsChange`, `customEnabledChange` |

### File Handling
| Component | Selector | Key Inputs |
|---|---|---|
| `FileUploadComponent` | `app-file-upload` | `label` |
| `InlineFileComponent` | `app-inline-file` | `fileName`, `fileType: 'mp4'|'pdf'|'png'|'jpeg'`, `uploadDate` | `viewed` |
| `UploadModalComponent` | `app-upload-modal` | `isOpen` | `closed`, `submitted` |

### Modals & Overlays
| Component | Selector | Key Inputs |
|---|---|---|
| `ModalComponent` | `app-modal` | `isOpen`, `title` | `closed` |
| `PaginationComponent` | `app-pagination` | `currentPage`, `totalPages`, `pageSize` | `pageChange`, `pageSizeChange` |
| `RoundTabsComponent` | `app-round-tabs` | `tabs: Tab[]`, `activeTab` | `activeTabChange` |

### Design System (#16)
| Component | Selector | Key Inputs | Key Outputs |
|---|---|---|---|
| `ChartComponent` | `app-chart` | `type: 'line'|'bar'`, `data: ChartDataPoint[]`, `color` | |
| `DateRangePickerComponent` | `app-date-range-picker` | — | `rangeChange` |
| `EmptyStateComponent` | `app-empty-state` | `title`, `description` (content slots: `[icon]`, `[cta]`) | |
| `SkeletonComponent` | `app-skeleton` | `variant: 'block'|'inline'|'avatar'`, `width`, `height` | |
| `BreadcrumbComponent` | `app-breadcrumb` | `items: BreadcrumbItem[]` | |
| `ConfirmModalComponent` | `app-confirm-modal` | `isOpen`, `title`, `message`, `confirmLabel`, `cancelLabel`, `danger` | `confirmed`, `cancelled` |
| `AlertBannerComponent` | `app-alert-banner` | `type: 'success'|'warning'|'error'|'info'`, `title`, `message`, `dismissible` | `dismissed` |
| `CommandPaletteComponent` | `app-command-palette` | `isOpen`, `groups: CommandGroup[]` | `selected`, `closed` |
| `DrawerComponent` | `app-drawer` | `isOpen`, `title`, `position: 'left'|'right'`, `width` (content slot: `[footer]`) | `closed` |
| `AvatarComponent` | `app-avatar` | `name`, `color`, `size: 'sm'|'md'|'lg'` | |
| `CalendarComponent` | `app-calendar` | `month`, `year`, `events: CalendarEvent[]`, `selectedDate` | `dateSelected`, `monthChange` |
| `ProgressBarComponent` | `app-progress-bar` | `value`, `max`, `label`, `color` | |
| `TabsComponent` | `app-tabs` | `tabs: TabItem[]`, `activeTab` | `activeTabChange` |

These 13 use the `input()`/`output()` signal APIs and `OnPush` — the newer Angular convention. Older components in this table still use `@Input()`/`@Output()` decorators; don't mass-migrate them, but write new components signal-first.

## Conventions
- All components are standalone — import them directly in the feature component's `imports: []`
- Use `[(x)]="val"` two-way binding where Input `x` + Output `xChange` exist
- Icons are inline SVG — no icon library needed
- Always use design tokens (`var(--color-blue)`) not hardcoded hex values
- `FormsModule` from `@angular/forms` needed for `[(ngModel)]` in templates
