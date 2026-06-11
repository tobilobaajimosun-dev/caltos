import { Component } from '@angular/core';
import {
  KpiCardComponent,
  PaginationComponent,
  RoundTabsComponent,
  FileUploadComponent,
  InlineFileComponent,
  ModalComponent,
  UploadModalComponent,
  ToggleComponent,
  CheckboxComponent,
  RadioButtonComponent,
  ToastComponent,
  BadgeCardComponent,
  StatusBadgeComponent,
  HeaderPillComponent,
  InputComponent,
  SearchComponent,
  ButtonComponent,
  IconButtonComponent,
  NavItemComponent,
  SettingsRowComponent,
  PermissionGroupComponent,
  OrgProfileComponent,
  SidebarComponent,
  ColumnTitleComponent,
  TableItemComponent,
  Tab,
  PermissionItem,
} from './shared/components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    KpiCardComponent,
    PaginationComponent,
    RoundTabsComponent,
    FileUploadComponent,
    InlineFileComponent,
    ModalComponent,
    UploadModalComponent,
    ToggleComponent,
    CheckboxComponent,
    RadioButtonComponent,
    ToastComponent,
    BadgeCardComponent,
    StatusBadgeComponent,
    HeaderPillComponent,
    InputComponent,
    SearchComponent,
    ButtonComponent,
    IconButtonComponent,
    NavItemComponent,
    SettingsRowComponent,
    PermissionGroupComponent,
    OrgProfileComponent,
    SidebarComponent,
    ColumnTitleComponent,
    TableItemComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  // Pagination
  currentPage = 1;
  pageSize = 100;

  // Tabs
  tabs: Tab[] = [
    { label: 'All Payouts', value: 'all' },
    { label: 'Successful', value: 'successful' },
    { label: 'Failed', value: 'failed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Reversed', value: 'reversed' },
  ];
  activeTab = 'all';

  // Modals
  showModal = false;
  showUploadModal = false;

  // Toggle / Checkbox / Radio state
  toggleOn = false;
  checked1 = false;
  checked2 = true;
  checked3 = false;
  radioSelected = false;

  // Input state
  inputValue = '';
  searchValue = '';

  // Settings rows
  settingsValue = 'Princeps Finance';
  emailValue = 'tech@princepsfinance.com';

  // Permission group
  permissions: PermissionItem[] = [
    { id: '1', label: 'View customer details', selected: true },
    { id: '2', label: 'View customer phone number', selected: true },
    { id: '3', label: 'Edit customer phone number', selected: false },
    { id: '4', label: 'Edit customer D.O.B', selected: false },
    { id: '5', label: 'View BVN', selected: true },
  ];
  customEnabled = true;

  // Table data
  tableUser = { name: 'Jesulademi Ajimosun', email: 'jesulademi.ajimosun@princepsfinance.com', initials: 'JA', avatarColor: '#2196F3' };

  // Toast visibility
  showSuccessToast = true;
  showErrorToast = true;

  // Active sidebar item
  activeNavItem = 'quick-actions';

  // Active pill
  activePill = 'all';
  pills = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];
}
