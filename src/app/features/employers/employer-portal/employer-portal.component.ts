import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  DrawerComponent,
  ChartComponent,
  ChartDataPoint,
} from '../../../shared/components';

type Channel = 'IPPIS' | 'Remita' | 'WACS' | 'Direct Debit';
type IntegrationStatus = 'connected' | 'pending';

interface UpcomingDeduction {
  borrower: string;
  amount: string;
  expectedDate: string;
}

interface EmployerRow {
  name: string;
  employees: number;
  deductionChannel: Channel;
  status: BadgeStatus;
  activeLoans: number;
  collectionRate: number;
  expectedThisMonth: number;
  actualThisMonth: number;
  activeMandates: number;
  overdueBorrowers: number;
  integrations: Partial<Record<Channel, IntegrationStatus>>;
  contact: { name: string; email: string };
  escalationContact: { name: string; email: string };
  monthlyTrend: ChartDataPoint[];
  upcomingDeductions: UpcomingDeduction[];
}

@Component({
  selector: 'app-employer-portal',
  standalone: true,
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent, DrawerComponent, ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employer-portal.component.html',
  styleUrl: './employer-portal.component.scss',
})
export class EmployerPortalComponent {
  readonly employers: EmployerRow[] = [
    {
      name: 'Federal Ministry of Works', employees: 1240, deductionChannel: 'IPPIS', status: 'active',
      activeLoans: 412, collectionRate: 96, expectedThisMonth: 8_200_000, actualThisMonth: 7_954_000,
      activeMandates: 405, overdueBorrowers: 7,
      integrations: { IPPIS: 'connected', WACS: 'connected' },
      contact: { name: 'Adaora Chukwu', email: 'adaora.chukwu@works.gov.ng' },
      escalationContact: { name: 'Bello Musa', email: 'bello.musa@works.gov.ng' },
      monthlyTrend: [
        { label: 'Feb', value: 91 }, { label: 'Mar', value: 93 }, { label: 'Apr', value: 89 },
        { label: 'May', value: 95 }, { label: 'Jun', value: 94 }, { label: 'Jul', value: 96 },
      ],
      upcomingDeductions: [
        { borrower: 'Bola Adebayo', amount: '₦75,000', expectedDate: '2026-07-10' },
        { borrower: 'Chika Okafor', amount: '₦45,000', expectedDate: '2026-07-10' },
        { borrower: 'Emeka Nwosu', amount: '₦95,000', expectedDate: '2026-07-15' },
      ],
    },
    {
      name: 'Lagos State Government', employees: 860, deductionChannel: 'Remita', status: 'active',
      activeLoans: 300, collectionRate: 84, expectedThisMonth: 6_100_000, actualThisMonth: 5_124_000,
      activeMandates: 288, overdueBorrowers: 22,
      integrations: { Remita: 'connected' },
      contact: { name: 'Funmi Aderibigbe', email: 'funmi.a@lagosstate.gov.ng' },
      escalationContact: { name: 'Ikenna Obi', email: 'ikenna.obi@lagosstate.gov.ng' },
      monthlyTrend: [
        { label: 'Feb', value: 88 }, { label: 'Mar', value: 85 }, { label: 'Apr', value: 80 },
        { label: 'May', value: 82 }, { label: 'Jun', value: 86 }, { label: 'Jul', value: 84 },
      ],
      upcomingDeductions: [
        { borrower: 'Gideon Mbogo', amount: '₦210,000', expectedDate: '2026-07-12' },
        { borrower: 'Ronke Balogun', amount: '₦150,000', expectedDate: '2026-07-18' },
      ],
    },
    {
      name: 'Dangote Group', employees: 320, deductionChannel: 'Direct Debit', status: 'active',
      activeLoans: 140, collectionRate: 91, expectedThisMonth: 3_000_000, actualThisMonth: 2_730_000,
      activeMandates: 132, overdueBorrowers: 5,
      integrations: { 'Direct Debit': 'connected' },
      contact: { name: 'Ifeoma Nwankwo', email: 'ifeoma.nwankwo@dangote.com' },
      escalationContact: { name: 'Tayo Alabi', email: 'tayo.alabi@dangote.com' },
      monthlyTrend: [
        { label: 'Feb', value: 90 }, { label: 'Mar', value: 92 }, { label: 'Apr', value: 88 },
        { label: 'May', value: 90 }, { label: 'Jun', value: 93 }, { label: 'Jul', value: 91 },
      ],
      upcomingDeductions: [{ borrower: 'Fatima Abdallah', amount: '₦95,000', expectedDate: '2026-07-20' }],
    },
    {
      name: 'NYSC Corps Members', employees: 2100, deductionChannel: 'Remita', status: 'pending',
      activeLoans: 0, collectionRate: 0, expectedThisMonth: 0, actualThisMonth: 0,
      activeMandates: 0, overdueBorrowers: 0,
      integrations: { Remita: 'pending' },
      contact: { name: 'Segun Falade', email: 'segun.falade@nysc.gov.ng' },
      escalationContact: { name: 'Amaka Eze', email: 'amaka.eze@nysc.gov.ng' },
      monthlyTrend: [],
      upcomingDeductions: [],
    },
  ];

  readonly selected = signal<EmployerRow | null>(null);

  open(employer: EmployerRow) {
    this.selected.set(employer);
  }

  close() {
    this.selected.set(null);
  }

  channels: Channel[] = ['IPPIS', 'Remita', 'WACS', 'Direct Debit'];
}
