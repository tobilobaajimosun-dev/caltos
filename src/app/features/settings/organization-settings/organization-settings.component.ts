import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  SettingsRowComponent, ToastComponent, ButtonComponent, ToggleComponent, SelectComponent, SelectOption,
  InputComponent, ModalComponent, StatusBadgeComponent, BadgeStatus,
  CheckboxComponent, RadioButtonComponent,
} from '../../../shared/components';
import { OrgBrandingService } from '../../../shared/services/org-branding.service';

type Section = 'organization' | 'branding' | 'approval' | 'integrations' | 'api-webhooks' | 'notifications' | 'security' | 'billing' | 'team';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'not-connected';
  lastSynced: string;
}

interface ApiKey {
  id: string;
  name: string;
  created: string;
  lastUsed: string;
  scope: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
}

interface WebhookLogEntry {
  at: string;
  event: string;
  status: BadgeStatus;
  responseCode: number;
}

interface NotificationRule {
  event: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

interface LoginEntry {
  at: string;
  ip: string;
  device: string;
  location: string;
}

interface InvoiceEntry {
  date: string;
  amount: string;
  status: BadgeStatus;
}

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [
    RouterLink, SettingsRowComponent, ToastComponent, ButtonComponent, ToggleComponent, SelectComponent,
    InputComponent, ModalComponent, StatusBadgeComponent, CheckboxComponent, RadioButtonComponent,
  ],
  templateUrl: './organization-settings.component.html',
  styleUrl: './organization-settings.component.scss',
})
export class OrganizationSettingsComponent {
  readonly sections: { id: Section; label: string }[] = [
    { id: 'organization', label: 'Organization Profile' },
    { id: 'branding', label: 'Branding' },
    { id: 'approval', label: 'Loan Approval Workflow' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'api-webhooks', label: 'API & Webhooks' },
    { id: 'notifications', label: 'Notification Preferences' },
    { id: 'security', label: 'Security' },
    { id: 'billing', label: 'Billing & Subscription' },
    { id: 'team', label: 'Team & Access' },
  ];

  readonly activeSection = signal<Section>('organization');
  setSection(id: Section) {
    this.activeSection.set(id);
  }

  readonly toastVisible = signal(false);
  private showToast() {
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2500);
  }

  // ── Organization profile ──
  orgName = 'Princeps Finance';
  rcNumber = 'RC1234567';
  licenseType = 'Microfinance';
  regulatorName = 'Central Bank of Nigeria (CBN)';
  address = '14 Adeola Odeku Street, Victoria Island, Lagos';
  phone = '+234 803 000 0000';
  website = 'https://princepsfinance.com';
  primaryEmail = 'hello@princepsfinance.com';
  timezone = 'Africa/Lagos';
  currency = 'NGN';

  readonly timezoneOptions: SelectOption[] = [
    { value: 'Africa/Lagos', label: 'Africa/Lagos (GMT+1)' },
    { value: 'UTC', label: 'UTC' },
  ];

  readonly currencyOptions: SelectOption[] = [
    { value: 'NGN', label: 'Nigerian Naira (₦)' },
    { value: 'USD', label: 'US Dollar ($)' },
  ];

  updateOrgName(value: string) { this.orgName = value; this.showToast(); }
  updateRcNumber(value: string) { this.rcNumber = value; this.showToast(); }
  updateLicenseType(value: string) { this.licenseType = value; this.showToast(); }
  updateRegulatorName(value: string) { this.regulatorName = value; this.showToast(); }
  updateAddress(value: string) { this.address = value; this.showToast(); }
  updatePhone(value: string) { this.phone = value; this.showToast(); }
  updateWebsite(value: string) { this.website = value; this.showToast(); }
  updatePrimaryEmail(value: string) { this.primaryEmail = value; this.showToast(); }
  updateAppName(value: string) { this.orgBranding.set({ appName: value }); this.showToast(); }

  // ── Branding ──
  private readonly orgBranding = inject(OrgBrandingService);

  get brandColor() { return this.orgBranding.branding().brandColor; }
  get appName() { return this.orgBranding.branding().appName; }
  get logoDataUrl() { return this.orgBranding.branding().logoDataUrl; }

  setBrandColor(value: string) {
    this.orgBranding.set({ brandColor: value });
    this.showToast();
  }

  onLogoFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.orgBranding.set({ logoDataUrl: reader.result as string });
      this.showToast();
    };
    reader.readAsDataURL(file);
  }

  // ── Loan approval workflow ──
  requireApproval = true;
  approvalLevel: 'single' | 'dual' | 'committee' = 'dual';
  autoApproveBelow = '50000';
  autoApproveLowRisk = true;
  escalationHours = '24';

  // ── Integrations ──
  readonly integrations = signal<Integration[]>([
    { id: 'remita', name: 'Remita', description: 'Salary verification and payroll deductions.', status: 'connected', lastSynced: '2026-07-06 06:00' },
    { id: 'ippis', name: 'IPPIS', description: 'Federal payroll integration for public sector loans.', status: 'connected', lastSynced: '2026-07-05 22:00' },
    { id: 'caltos-verify', name: 'Caltos Verify', description: 'Digital signature for offer letters.', status: 'connected', lastSynced: '2026-07-04 10:00' },
    { id: 'mono', name: 'Mono', description: 'Bank statement analysis for credit assessment.', status: 'not-connected', lastSynced: '—' },
    { id: 'paystack', name: 'Paystack', description: 'Card and bank payment processing.', status: 'not-connected', lastSynced: '—' },
    { id: 'termii', name: 'Termii', description: 'SMS delivery for borrower notifications.', status: 'connected', lastSynced: '2026-07-06 05:30' },
  ]);

  toggleIntegration(integration: Integration) {
    this.integrations.update((all) => all.map((i) => (i.id === integration.id
      ? { ...i, status: i.status === 'connected' ? 'not-connected' : 'connected', lastSynced: i.status === 'connected' ? '—' : new Date().toISOString().slice(0, 16).replace('T', ' ') }
      : i)));
    this.showToast();
  }

  // ── API & Webhooks ──
  readonly apiKeys = signal<ApiKey[]>([
    { id: 'k1', name: 'Production key', created: '2025-01-10', lastUsed: '2026-07-06', scope: 'Full access' },
    { id: 'k2', name: 'Reporting key (read-only)', created: '2025-06-02', lastUsed: '2026-06-30', scope: 'Read-only' },
  ]);

  showNewKeyModal = signal(false);
  newKeyName = signal('');
  newKeyScope = signal('full');

  readonly keyScopeOptions: SelectOption[] = [
    { value: 'full', label: 'Full access' },
    { value: 'read-only', label: 'Read-only' },
  ];

  openNewKeyModal() {
    this.newKeyName.set('');
    this.newKeyScope.set('full');
    this.showNewKeyModal.set(true);
  }

  createApiKey() {
    if (!this.newKeyName().trim()) return;
    this.apiKeys.update((all) => [
      { id: 'k' + Date.now(), name: this.newKeyName(), created: new Date().toISOString().slice(0, 10), lastUsed: 'Never', scope: this.newKeyScope() === 'full' ? 'Full access' : 'Read-only' },
      ...all,
    ]);
    this.showNewKeyModal.set(false);
    this.showToast();
  }

  revokeKey(key: ApiKey) {
    this.apiKeys.update((all) => all.filter((k) => k.id !== key.id));
    this.showToast();
  }

  readonly webhooks = signal<Webhook[]>([
    { id: 'w1', url: 'https://hooks.princepsfinance.com/loans', events: ['loan.approved', 'loan.disbursed'], status: 'active' },
  ]);

  showNewWebhookModal = signal(false);
  newWebhookUrl = signal('');
  newWebhookEvents = signal<string[]>([]);

  readonly availableEvents = ['loan.approved', 'loan.disbursed', 'repayment.received', 'loan.overdue', 'wallet.low_balance'];

  openNewWebhookModal() {
    this.newWebhookUrl.set('');
    this.newWebhookEvents.set([]);
    this.showNewWebhookModal.set(true);
  }

  toggleWebhookEvent(event: string, checked: boolean) {
    this.newWebhookEvents.update((all) => (checked ? [...all, event] : all.filter((e) => e !== event)));
  }

  createWebhook() {
    if (!this.newWebhookUrl().trim()) return;
    this.webhooks.update((all) => [...all, { id: 'w' + Date.now(), url: this.newWebhookUrl(), events: this.newWebhookEvents(), status: 'active' }]);
    this.showNewWebhookModal.set(false);
    this.showToast();
  }

  removeWebhook(webhook: Webhook) {
    this.webhooks.update((all) => all.filter((w) => w.id !== webhook.id));
    this.showToast();
  }

  readonly webhookLog: WebhookLogEntry[] = [
    { at: '2026-07-06 06:15', event: 'loan.approved', status: 'successful', responseCode: 200 },
    { at: '2026-07-05 14:30', event: 'loan.disbursed', status: 'successful', responseCode: 200 },
    { at: '2026-07-04 09:00', event: 'loan.approved', status: 'failed', responseCode: 500 },
  ];

  // ── Notification preferences (event x channel matrix) ──
  readonly notificationMatrix = signal<NotificationRule[]>([
    { event: 'Loan approved', inApp: true, email: true, sms: false },
    { event: 'Loan disbursed', inApp: true, email: true, sms: true },
    { event: 'Repayment received', inApp: true, email: true, sms: false },
    { event: 'Loan overdue (day 1)', inApp: true, email: true, sms: true },
    { event: 'Wallet low balance', inApp: true, email: true, sms: false },
    { event: 'New team member', inApp: true, email: true, sms: false },
  ]);

  toggleMatrixCell(rule: NotificationRule, channel: 'inApp' | 'email' | 'sms') {
    this.notificationMatrix.update((all) => all.map((r) => (r.event === rule.event ? { ...r, [channel]: !r[channel] } : r)));
  }

  // ── Security ──
  twoFactorEnabled = false;
  show2faSetup = signal(false);
  readonly backupCodes = ['A1B2-C3D4', 'E5F6-G7H8', 'I9J0-K1L2', 'M3N4-O5P6', 'Q7R8-S9T0'];

  toggle2fa(checked: boolean) {
    if (checked) {
      this.show2faSetup.set(true);
    } else {
      this.twoFactorEnabled = false;
    }
  }

  confirm2faSetup() {
    this.twoFactorEnabled = true;
    this.show2faSetup.set(false);
    this.showToast();
  }

  readonly activeSessions = signal([
    { device: 'Chrome on macOS', location: 'Lagos, NG', lastActive: 'Just now', current: true },
    { device: 'Safari on iPhone', location: 'Lagos, NG', lastActive: '2 hours ago', current: false },
  ]);

  revokeOtherSessions() {
    this.activeSessions.update((all) => all.filter((s) => s.current));
    this.showToast();
  }

  readonly loginHistory: LoginEntry[] = [
    { at: '2026-07-06 08:00', ip: '105.112.4.21', device: 'Chrome on macOS', location: 'Lagos, NG' },
    { at: '2026-07-05 07:55', ip: '105.112.4.21', device: 'Chrome on macOS', location: 'Lagos, NG' },
    { at: '2026-07-04 19:12', ip: '197.210.55.9', device: 'Safari on iPhone', location: 'Lagos, NG' },
  ];

  currentPassword = '';
  newPassword = '';

  changePassword() {
    if (!this.currentPassword || !this.newPassword) return;
    this.currentPassword = '';
    this.newPassword = '';
    this.showToast();
  }

  readonly ipAllowlist = signal<string[]>(['41.203.0.0/16']);
  newIpRange = signal('');

  addIpRange() {
    if (!this.newIpRange().trim()) return;
    this.ipAllowlist.update((all) => [...all, this.newIpRange()]);
    this.newIpRange.set('');
  }

  removeIpRange(range: string) {
    this.ipAllowlist.update((all) => all.filter((r) => r !== range));
  }

  // ── Billing ──
  readonly currentPlan = { name: 'Growth', price: '₦150,000/month', cycle: 'Monthly' };
  readonly usageMeters = [
    { label: 'Active loans', used: 374, limit: 1000 },
    { label: 'Team members', used: 6, limit: 10 },
    { label: 'API calls (this month)', used: 42_300, limit: 100_000 },
  ];

  readonly invoices: InvoiceEntry[] = [
    { date: '2026-07-01', amount: '₦150,000', status: 'successful' },
    { date: '2026-06-01', amount: '₦150,000', status: 'successful' },
    { date: '2026-05-01', amount: '₦150,000', status: 'successful' },
  ];

  showCancelModal = signal(false);
  cancelConfirmText = signal('');

  openCancelModal() {
    this.cancelConfirmText.set('');
    this.showCancelModal.set(true);
  }

  get cancelConfirmMatches(): boolean {
    return this.cancelConfirmText().trim() === this.orgName;
  }

  confirmCancelSubscription() {
    if (!this.cancelConfirmMatches) return;
    this.showCancelModal.set(false);
    this.showToast();
  }

  // ── Danger zone ──
  showDeleteOrgModal = signal(false);
  deleteConfirmText = signal('');

  openDeleteOrgModal() {
    this.deleteConfirmText.set('');
    this.showDeleteOrgModal.set(true);
  }

  get deleteConfirmMatches(): boolean {
    return this.deleteConfirmText().trim() === this.orgName;
  }

  confirmDeleteOrg() {
    if (!this.deleteConfirmMatches) return;
    this.showDeleteOrgModal.set(false);
  }
}
