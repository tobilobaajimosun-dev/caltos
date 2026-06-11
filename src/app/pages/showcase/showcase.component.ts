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
} from '../../shared/components';

@Component({
  selector: 'app-showcase',
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
  templateUrl: './showcase.component.html',
  styleUrls: ['./showcase.component.scss'],
})
export class ShowcaseComponent {
  currentPage = 1;
  pageSize = 100;

  tabs: Tab[] = [
    { label: 'All Payouts', value: 'all' },
    { label: 'Successful', value: 'successful' },
    { label: 'Failed', value: 'failed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Reversed', value: 'reversed' },
  ];
  activeTab = 'all';

  showModal = false;
  showUploadModal = false;

  toggleOn = false;
  checked1 = false;
  checked2 = true;
  checked3 = false;
  radioSelected = false;

  inputValue = '';
  searchValue = '';

  settingsValue = 'Princeps Finance';
  emailValue = 'tech@princepsfinance.com';

  permissions: PermissionItem[] = [
    { id: '1', label: 'View customer details', selected: true },
    { id: '2', label: 'View customer phone number', selected: true },
    { id: '3', label: 'Edit customer phone number', selected: false },
    { id: '4', label: 'Edit customer D.O.B', selected: false },
    { id: '5', label: 'View BVN', selected: true },
  ];
  customEnabled = true;

  tableUser = { name: 'Jesulademi Ajimosun', email: 'jesulademi.ajimosun@princepsfinance.com', initials: 'JA', avatarColor: '#2196F3' };

  showSuccessToast = true;
  showErrorToast = true;

  activeNavItem = 'quick-actions';

  activePill = 'all';
  pills = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];
}
