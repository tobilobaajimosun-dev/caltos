import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent, BadgeStatus } from '../../../shared/components';

interface VendorRow {
  name: string;
  serviceType: string;
  status: BadgeStatus;
  statusLabel: string;
  contactName: string;
  contactEmail: string;
}

@Component({
  selector: 'app-vendor-management',
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vendor-management.component.html',
  styleUrl: './vendor-management.component.scss',
})
export class VendorManagementComponent {
  readonly vendors = signal<VendorRow[]>([
    {
      name: 'Youverify',
      serviceType: 'BVN / NIN verification',
      status: 'active',
      statusLabel: 'Active',
      contactName: 'Chiamaka Obi',
      contactEmail: 'chiamaka.obi@youverify.co',
    },
    {
      name: 'Termii',
      serviceType: 'SMS gateway',
      status: 'active',
      statusLabel: 'Active',
      contactName: 'David Okon',
      contactEmail: 'david.okon@termii.com',
    },
    {
      name: 'CRC Credit Bureau',
      serviceType: 'Credit bureau',
      status: 'active',
      statusLabel: 'Active',
      contactName: 'Ngozi Umeh',
      contactEmail: 'ngozi.umeh@crccreditbureau.com',
    },
    {
      name: 'Paystack',
      serviceType: 'Payment gateway',
      status: 'active',
      statusLabel: 'Active',
      contactName: 'Tunde Bakare',
      contactEmail: 'tunde.bakare@paystack.com',
    },
    {
      name: 'Remita',
      serviceType: 'Payroll deduction processor',
      status: 'pending',
      statusLabel: 'Pending renewal',
      contactName: 'Halima Sadiq',
      contactEmail: 'halima.sadiq@remita.net',
    },
    {
      name: 'FirstCentral Credit Bureau',
      serviceType: 'Credit bureau',
      status: 'inactive',
      statusLabel: 'Expired',
      contactName: 'Peter Nnamdi',
      contactEmail: 'peter.nnamdi@firstcentralcreditbureau.com',
    },
  ]);

  readonly activeVendors = computed(() => this.vendors().filter((v) => v.status === 'active').length);
  readonly expiringSoon = computed(() => this.vendors().filter((v) => v.status === 'pending').length);
  readonly totalVendors = computed(() => this.vendors().length);
}
