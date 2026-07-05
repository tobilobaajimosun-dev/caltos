import { Component, signal } from '@angular/core';
import { SettingsRowComponent, ToastComponent } from '../../../shared/components';

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [SettingsRowComponent, ToastComponent],
  templateUrl: './organization-settings.component.html',
  styleUrl: './organization-settings.component.scss',
})
export class OrganizationSettingsComponent {
  orgName = 'Princeps Finance';
  rcNumber = 'RC1234567';
  licenseType = 'Microfinance';
  regulatorName = 'Central Bank of Nigeria (CBN)';

  readonly toastVisible = signal(false);

  update(field: 'orgName' | 'rcNumber' | 'licenseType' | 'regulatorName', value: string) {
    this[field] = value;
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2500);
  }
}
