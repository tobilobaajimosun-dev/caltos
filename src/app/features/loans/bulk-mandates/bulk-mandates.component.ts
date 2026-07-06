import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  AlertBannerComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
  SelectComponent,
  SelectOption,
  ButtonComponent,
  CheckboxComponent,
} from '../../../shared/components';
import { HiIconComponent, IconData } from '../../../shared/components/hi-icon/hi-icon.component';
import { Tick01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

type Channel = 'IPPIS' | 'Remita' | 'Dedukt' | 'WACS' | 'Direct Debit';
type SetupStatus = 'configured' | 'pending' | 'missing' | 'broken';
type HealthStatus = 'connected' | 'pending' | 'broken' | 'not-configured';

interface MandateRow {
  customer: { name: string; email: string };
  channel: Channel;
  employer: string;
  amount: string;
  date: string;
  status: BadgeStatus;
  selected?: boolean;
}

interface DeduktSetupRow {
  loanId: string;
  customer: { name: string; email: string };
  setupStatus: SetupStatus;
  referenceLinked: boolean;
}

interface HealthRow {
  channel: Channel;
  connected: number;
  pending: number;
  broken: number;
  notConfigured: number;
}

interface RemittanceRow {
  mandateId: string;
  customer: { name: string; email: string };
  expectedDate: string;
  actualDate: string | null;
  onTime: boolean;
}

@Component({
  selector: 'app-bulk-mandates',
  standalone: true,
  imports: [
    KpiCardComponent,
    ColumnTitleComponent,
    TableItemComponent,
    StatusBadgeComponent,
    AlertBannerComponent,
    RoundTabsComponent,
    SelectComponent,
    ButtonComponent,
    CheckboxComponent,
    HiIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bulk-mandates.component.html',
  styleUrl: './bulk-mandates.component.scss',
})
export class BulkMandatesComponent {
  readonly tickIcon: IconData = Tick01Icon as IconData;
  readonly cancelIcon: IconData = Cancel01Icon as IconData;

  readonly tabs: Tab[] = [
    { label: 'Bulk Cancel', value: 'cancel' },
    { label: 'Dedukt Setup Status', value: 'setup' },
    { label: 'Mandate Health', value: 'health' },
    { label: 'Remittance Timeline', value: 'timeline' },
  ];

  readonly activeTab = signal('cancel');
  setTab(value: string) {
    this.activeTab.set(value);
  }

  readonly channelFilter = signal('all');
  readonly employerFilter = signal('all');

  readonly channelOptions: SelectOption[] = [
    { value: 'all', label: 'All channels' },
    { value: 'IPPIS', label: 'IPPIS' },
    { value: 'Remita', label: 'Remita' },
    { value: 'Dedukt', label: 'Dedukt' },
    { value: 'WACS', label: 'WACS' },
    { value: 'Direct Debit', label: 'Direct Debit' },
  ];

  readonly employerOptions: SelectOption[] = [
    { value: 'all', label: 'All employers' },
    { value: 'Federal Ministry of Health', label: 'Federal Ministry of Health' },
    { value: 'Nigeria Police Force', label: 'Nigeria Police Force' },
    { value: 'Private sector', label: 'Private sector' },
  ];

  readonly rows = signal<MandateRow[]>([
    { customer: { name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com' }, channel: 'Remita', employer: 'Federal Ministry of Health', amount: '₦150,000', date: '2026-06-01', status: 'successful' },
    { customer: { name: 'Bola Adebayo', email: 'bola@princepsfinance.com' }, channel: 'IPPIS', employer: 'Nigeria Police Force', amount: '₦75,000', date: '2026-06-10', status: 'successful' },
    { customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, channel: 'Dedukt', employer: 'Private sector', amount: '₦320,000', date: '2026-06-15', status: 'failed' },
    { customer: { name: 'Damilola Ojo', email: 'damilola@princepsfinance.com' }, channel: 'WACS', employer: 'Federal Ministry of Health', amount: '₦45,000', date: '2026-06-20', status: 'pending' },
    { customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, channel: 'Direct Debit', employer: 'Private sector', amount: '₦95,000', date: '2026-07-01', status: 'successful' },
  ]);

  readonly filteredRows = computed(() => this.rows().filter((r) =>
    (this.channelFilter() === 'all' || r.channel === this.channelFilter()) &&
    (this.employerFilter() === 'all' || r.employer === this.employerFilter()),
  ));

  readonly anySelected = computed(() => this.filteredRows().some((r) => r.selected));
  readonly selectedCount = computed(() => this.filteredRows().filter((r) => r.selected).length);

  toggleSelect(row: MandateRow, checked: boolean) {
    this.rows.update((all) => all.map((r) => (r === row ? { ...r, selected: checked } : r)));
  }

  bulkCancel() {
    this.rows.update((all) => all.map((r) => (r.selected ? { ...r, status: 'inactive' as BadgeStatus, selected: false } : r)));
  }

  readonly deduktSetup = signal<DeduktSetupRow[]>([
    { loanId: 'LN-88215', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, setupStatus: 'configured', referenceLinked: true },
    { loanId: 'LN-88220', customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, setupStatus: 'pending', referenceLinked: false },
    { loanId: 'LN-88221', customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, setupStatus: 'broken', referenceLinked: false },
    { loanId: 'LN-88222', customer: { name: 'Ronke Balogun', email: 'ronke@princepsfinance.com' }, setupStatus: 'missing', referenceLinked: false },
  ]);

  setupBadge(status: SetupStatus): { status: BadgeStatus; label: string } {
    switch (status) {
      case 'configured': return { status: 'successful', label: 'Configured' };
      case 'pending': return { status: 'pending', label: 'Pending' };
      case 'broken': return { status: 'failed', label: 'Broken link' };
      case 'missing': return { status: 'inactive', label: 'Missing' };
    }
  }

  readonly healthByChannel: HealthRow[] = [
    { channel: 'IPPIS', connected: 412, pending: 8, broken: 1, notConfigured: 0 },
    { channel: 'Remita', connected: 380, pending: 14, broken: 3, notConfigured: 2 },
    { channel: 'Dedukt', connected: 96, pending: 22, broken: 9, notConfigured: 6 },
    { channel: 'WACS', connected: 210, pending: 4, broken: 0, notConfigured: 0 },
    { channel: 'Direct Debit', connected: 58, pending: 3, broken: 2, notConfigured: 1 },
  ];

  readonly remittanceTimeline: RemittanceRow[] = [
    { mandateId: 'DK-90101', customer: { name: 'Chika Okafor', email: 'chika@princepsfinance.com' }, expectedDate: '2026-07-01', actualDate: '2026-07-01', onTime: true },
    { mandateId: 'DK-90102', customer: { name: 'Gideon Mbogo', email: 'gideon@princepsfinance.com' }, expectedDate: '2026-07-01', actualDate: '2026-07-04', onTime: false },
    { mandateId: 'DK-90103', customer: { name: 'Fatima Abdallah', email: 'fatima@princepsfinance.com' }, expectedDate: '2026-07-02', actualDate: null, onTime: false },
    { mandateId: 'DK-90104', customer: { name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com' }, expectedDate: '2026-07-03', actualDate: '2026-07-03', onTime: true },
  ];

  exportCompleted() {
    const completed = this.deduktSetup().filter((r) => r.setupStatus === 'configured');
    const header = 'Loan ID,Customer,Email,Setup Status\n';
    const body = completed.map((r) => `${r.loanId},${r.customer.name},${r.customer.email},Completed`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dedukt-completed-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
