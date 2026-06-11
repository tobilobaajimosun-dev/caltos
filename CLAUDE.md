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
```

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
| `SidebarComponent` | `app-sidebar` | `orgName`, `activeItemId` | `navChange` |

NavItemIcon values: `'dashboard'|'home'|'customers'|'wallet'|'products'|'loans'|'reports'|'risk'|'teams'|'settings'|'quick-action'|'none'`

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

## Conventions
- All components are standalone — import them directly in the feature component's `imports: []`
- Use `[(x)]="val"` two-way binding where Input `x` + Output `xChange` exist
- Icons are inline SVG — no icon library needed
- Always use design tokens (`var(--color-blue)`) not hardcoded hex values
- `FormsModule` from `@angular/forms` needed for `[(ngModel)]` in templates
