import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AvatarComponent,
  StatusBadgeComponent,
  BadgeStatus,
  RoundTabsComponent,
  Tab,
  DrawerComponent,
  ModalComponent,
  SelectComponent,
  SelectOption,
  InputComponent,
  ButtonComponent,
  PermissionGroupComponent,
  ColumnTitleComponent,
  TableItemComponent,
  TableItemUser,
  ConfirmModalComponent,
  ToastComponent,
  SearchComponent,
  IconButtonComponent,
  RowMenuComponent,
  ToggleComponent,
} from '../../shared/components';
import {
  TeamsService, TeamMember, Role, MemberStatus, AssignedLoan, buildPermissionGroups,
} from '../../shared/services/teams.service';

const AVATAR_PALETTE = ['#0053a6', '#7c5cff', '#0e9f6e', '#d97706', '#dc2677', '#0891b2'];

/** Lending-platform roles shown in the UI. "Relationship Officer" maps to the
 *  service's 'Custom' role since TeamsService's Role union is fixed. */
export type LendingRole = 'Admin' | 'Manager' | 'Loan Officer' | 'Relationship Officer' | 'Auditor';

interface MemberExtras {
  role?: LendingRole;
  jobTitle: string;
  department: string;
  autoAssign: boolean;
}

interface RoleRow {
  name: string;
  description: string;
  type: 'System' | 'Custom';
  status: 'Active' | 'Needs review';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_EXTRAS: MemberExtras = { jobTitle: '', department: '', autoAssign: false };

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    AvatarComponent, StatusBadgeComponent, RoundTabsComponent, DrawerComponent, ModalComponent,
    SelectComponent, InputComponent, ButtonComponent, PermissionGroupComponent, ColumnTitleComponent,
    TableItemComponent, ConfirmModalComponent, ToastComponent, SearchComponent, IconButtonComponent,
    RowMenuComponent, ToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape()' },
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
})
export class TeamsComponent {
  private readonly teamsService = inject(TeamsService);

  readonly members = this.teamsService.members;

  // ── Views ──
  readonly view = signal<'list' | 'roles'>('list');
  readonly inviteMode = signal<'single' | 'multi' | null>(null);

  // ── Lending role catalogue ──
  readonly lendingRoles: { name: LendingRole; description: string; type: 'System' | 'Custom' }[] = [
    { name: 'Admin', description: 'Full control including policies, products, and settings.', type: 'System' },
    { name: 'Manager', description: 'Approves loans and oversees officers.', type: 'System' },
    { name: 'Loan Officer', description: 'Originates and manages assigned loans.', type: 'System' },
    { name: 'Relationship Officer', description: 'Owns customer relationships and follow-ups.', type: 'Custom' },
    { name: 'Auditor', description: 'Read-only access to all records.', type: 'Custom' },
  ];

  readonly roleRows = signal<RoleRow[]>([
    { name: 'Admin', description: 'Full control including policies, products, and settings.', type: 'System', status: 'Active' },
    { name: 'Manager', description: 'Approves loans and oversees officers.', type: 'System', status: 'Active' },
    { name: 'Loan Officer', description: 'Originates and manages assigned loans.', type: 'System', status: 'Active' },
    { name: 'Relationship Officer', description: 'Owns customer relationships and follow-ups.', type: 'Custom', status: 'Needs review' },
    { name: 'Auditor', description: 'Read-only access to all records.', type: 'Custom', status: 'Active' },
  ]);

  // ── Per-member lending extras (job title, department, auto-assign, display role) ──
  readonly extras = signal<Record<string, MemberExtras>>({
    m1: { jobTitle: 'Chief Executive Officer', department: 'Operations', autoAssign: false },
    m2: { jobTitle: 'Senior Loan Officer', department: 'Credit', autoAssign: true },
    m3: { jobTitle: 'Head of Credit', department: 'Credit', autoAssign: false },
    m4: { jobTitle: 'Compliance Officer', department: 'Finance', autoAssign: false },
    m5: { jobTitle: 'Loan Officer', department: 'Recovery', autoAssign: false },
    m6: { role: 'Relationship Officer', jobTitle: 'Customer Success Lead', department: 'Customer Success', autoAssign: true },
  });

  constructor() {
    // Seed one Relationship Officer so the custom role + auto-assign chip are visible.
    if (!this.members().some((m) => m.id === 'm6')) {
      this.members.update((all) => [...all, {
        id: 'm6', firstName: 'Amara', lastName: 'Eze', email: 'amara.eze@princepsfinance.com', phone: '0803 555 6666',
        role: 'Custom', status: 'active', lastActive: '2026-07-17T11:00:00Z', loansAssigned: 9, joinedDate: '2025-06-20',
        statsProcessed: 61, statsDisbursed: '₦7,900,000', statsCollectionRate: 89.1,
        permissionGroups: buildPermissionGroups('Loan Officer'),
        activity: [{ at: '2026-07-17 11:00', action: 'Followed up with customer Ada Obi' }],
        assignedLoans: [{ loanId: 'LN-88240', customer: 'Ada Obi', amount: '₦120,000', status: 'Active' }],
      }]);
    }
  }

  extrasOf(member: TeamMember): MemberExtras {
    return this.extras()[member.id] ?? DEFAULT_EXTRAS;
  }

  displayRoleOf(member: TeamMember): string {
    return this.extrasOf(member).role ?? member.role;
  }

  isOfficerRole(role: string | null): boolean {
    return role === 'Loan Officer' || role === 'Relationship Officer';
  }

  private toServiceRole(role: LendingRole): Role {
    return role === 'Relationship Officer' ? 'Custom' : role;
  }

  private permissionsFor(role: LendingRole) {
    return buildPermissionGroups(role === 'Relationship Officer' ? 'Loan Officer' : role);
  }

  // ── Header ──
  readonly memberCountLabel = computed(() => {
    const count = this.members().length;
    return `${count} member${count === 1 ? '' : 's'}`;
  });

  readonly inviteMenuOpen = signal(false);

  toggleInviteMenu() {
    this.inviteMenuOpen.update((v) => !v);
  }

  // ── Filters ──
  readonly statusFilter = signal<'all' | 'review'>('all');
  readonly roleFilter = signal<string | null>(null);
  readonly roleFilterOpen = signal(false);
  readonly searchQuery = signal('');

  setStatusFilter(v: 'all' | 'review') {
    this.statusFilter.set(v);
  }

  setRoleFilter(role: string | null) {
    this.roleFilter.set(role);
    this.roleFilterOpen.set(false);
  }

  readonly filteredMembers = computed(() => {
    const extras = this.extras();
    let list = this.members();
    if (this.statusFilter() === 'review') list = list.filter((m) => m.status !== 'active');
    const rf = this.roleFilter();
    if (rf) list = list.filter((m) => (extras[m.id]?.role ?? m.role) === rf);
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter((m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(query) || m.email.toLowerCase().includes(query));
    }
    return list;
  });

  memberUser(member: TeamMember): TableItemUser {
    const name = `${member.firstName} ${member.lastName}`;
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
    return {
      name,
      email: member.email,
      initials: `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase(),
      avatarColor: AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length],
    };
  }

  statusBadge(status: MemberStatus): { status: BadgeStatus; label: string } {
    switch (status) {
      case 'active': return { status: 'active', label: 'Active' };
      case 'pending': return { status: 'pending', label: 'Pending Invite' };
      case 'suspended': return { status: 'suspended', label: 'Suspended' };
    }
  }

  relativeTime(iso: string): string {
    if (!iso) return 'Never';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // ── Roles view ──
  roleMemberNames(roleName: string): string[] {
    const extras = this.extras();
    return this.members()
      .filter((m) => (extras[m.id]?.role ?? m.role) === roleName)
      .map((m) => `${m.firstName} ${m.lastName}`);
  }

  roleStack(roleName: string): { shown: string[]; extra: number } {
    const names = this.roleMemberNames(roleName);
    return { shown: names.slice(0, 3), extra: Math.max(0, names.length - 3) };
  }

  readonly createRoleOpen = signal(false);
  readonly newRoleName = signal('');
  readonly newRoleDesc = signal('');

  openCreateRole() {
    this.newRoleName.set('');
    this.newRoleDesc.set('');
    this.createRoleOpen.set(true);
  }

  saveNewRole() {
    const name = this.newRoleName().trim();
    if (!name) return;
    this.roleRows.update((rows) => [...rows, {
      name,
      description: this.newRoleDesc().trim() || 'Custom role — permissions to be configured.',
      type: 'Custom',
      status: 'Needs review',
    }]);
    this.createRoleOpen.set(false);
    this.showToast(`Role "${name}" created. Configure its permissions before assigning members.`);
  }

  // ── Row actions dropdown ──
  readonly openMenuId = signal<string | null>(null);

  setMenuOpen(memberId: string, open: boolean) {
    this.openMenuId.set(open ? memberId : null);
  }

  closeMenu() {
    this.openMenuId.set(null);
  }

  // ── Member profile drawer ──
  readonly selected = signal<TeamMember | null>(null);
  readonly profileTab = signal('overview');

  readonly profileTabs: Tab[] = [
    { label: 'Overview', value: 'overview' },
    { label: 'Permissions', value: 'permissions' },
    { label: 'Activity Log', value: 'activity' },
    { label: 'Assigned Loans', value: 'loans' },
  ];

  open(member: TeamMember) {
    this.profileTab.set('overview');
    this.selected.set(member);
  }

  close() {
    this.selected.set(null);
  }

  setProfileTab(v: string) {
    this.profileTab.set(v);
  }

  // ── Change role ──
  readonly roleChangeTarget = signal<TeamMember | null>(null);
  readonly roleChangeValue = signal<LendingRole>('Loan Officer');

  readonly changeRoleOptions: SelectOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Loan Officer', label: 'Loan Officer' },
    { value: 'Relationship Officer', label: 'Relationship Officer' },
    { value: 'Auditor', label: 'Auditor' },
  ];

  roleDescription(role: string): string {
    return this.lendingRoles.find((r) => r.name === role)?.description ?? '';
  }

  openChangeRole(member: TeamMember) {
    this.closeMenu();
    const current = this.displayRoleOf(member);
    this.roleChangeValue.set(this.isKnownLendingRole(current) ? current as LendingRole : 'Loan Officer');
    this.roleChangeTarget.set(member);
  }

  private isKnownLendingRole(role: string): boolean {
    return this.lendingRoles.some((r) => r.name === role);
  }

  closeChangeRole() {
    this.roleChangeTarget.set(null);
  }

  setRoleChangeValue(value: string) {
    this.roleChangeValue.set(value as LendingRole);
  }

  saveRoleChange() {
    const member = this.roleChangeTarget();
    if (!member) return;
    const role = this.roleChangeValue();
    this.members.update((all) => all.map((m) => (m.id === member.id
      ? { ...m, role: this.toServiceRole(role), permissionGroups: this.permissionsFor(role) }
      : m)));
    this.extras.update((all) => ({
      ...all,
      [member.id]: {
        ...(all[member.id] ?? DEFAULT_EXTRAS),
        role: role === 'Relationship Officer' ? 'Relationship Officer' : undefined,
        autoAssign: this.isOfficerRole(role) ? (all[member.id]?.autoAssign ?? true) : false,
      },
    }));
    this.roleChangeTarget.set(null);
    this.showToast(`${member.firstName} ${member.lastName} is now ${role === 'Admin' || role === 'Auditor' ? 'an' : 'a'} ${role}.`);
  }

  // ── Suspend / remove ──
  confirmTarget = signal<TeamMember | null>(null);
  confirmAction = signal<'suspend' | 'reactivate' | 'remove' | null>(null);

  requestSuspend(member: TeamMember) {
    this.closeMenu();
    this.confirmTarget.set(member);
    this.confirmAction.set(member.status === 'suspended' ? 'reactivate' : 'suspend');
  }

  requestRemove(member: TeamMember) {
    this.closeMenu();
    this.confirmTarget.set(member);
    this.confirmAction.set('remove');
  }

  get confirmModalCopy() {
    const name = this.confirmTarget() ? `${this.confirmTarget()!.firstName} ${this.confirmTarget()!.lastName}` : 'this member';
    switch (this.confirmAction()) {
      case 'suspend': return { title: 'Suspend member?', message: `${name} will lose access immediately. This can be reversed later.`, confirmLabel: 'Suspend', danger: true };
      case 'reactivate': return { title: 'Reactivate member?', message: `${name} will regain access.`, confirmLabel: 'Reactivate', danger: false };
      case 'remove': return { title: 'Remove member?', message: `This permanently removes ${name} from your team.`, confirmLabel: 'Remove', danger: true };
      default: return { title: '', message: '', confirmLabel: 'Confirm', danger: false };
    }
  }

  confirmActionExecute() {
    const member = this.confirmTarget();
    const action = this.confirmAction();
    if (!member || !action) return;
    if (action === 'suspend') {
      this.members.update((all) => all.map((m) => (m.id === member.id ? { ...m, status: 'suspended' } : m)));
      this.showToast(`${member.firstName} ${member.lastName} has been suspended.`);
    } else if (action === 'reactivate') {
      this.members.update((all) => all.map((m) => (m.id === member.id ? { ...m, status: 'active' } : m)));
      this.showToast(`${member.firstName} ${member.lastName} has been reactivated.`);
    } else if (action === 'remove') {
      this.members.update((all) => all.filter((m) => m.id !== member.id));
      this.close();
      this.showToast(`${member.firstName} ${member.lastName} has been removed.`);
    }
    this.confirmTarget.set(null);
    this.confirmAction.set(null);
  }

  cancelConfirm() {
    this.confirmTarget.set(null);
    this.confirmAction.set(null);
  }

  resendInvite(member: TeamMember) {
    this.closeMenu();
    this.showToast(`Invite resent to ${member.email}.`);
  }

  reassignLoan(member: TeamMember, loan: AssignedLoan) {
    this.showToast(`${loan.loanId} reassignment started.`);
  }

  // ── Invite a user (full-screen overlay, 3 steps) ──
  readonly inviteSteps = ['User Details', 'Assign Role', 'Review & Send'];
  readonly inviteStep = signal(0);

  readonly inviteFirstName = signal('');
  readonly inviteLastName = signal('');
  readonly inviteEmail = signal('');
  readonly inviteJobTitle = signal('');
  readonly inviteDepartment = signal('');
  readonly inviteRole = signal<LendingRole | null>(null);
  readonly inviteAutoAssign = signal(true);

  readonly jobTitleOptions: SelectOption[] = [
    { value: '', label: 'Select a job title' },
    { value: 'Loan Officer', label: 'Loan Officer' },
    { value: 'Senior Loan Officer', label: 'Senior Loan Officer' },
    { value: 'Credit Risk Analyst', label: 'Credit Risk Analyst' },
    { value: 'Head of Credit', label: 'Head of Credit' },
    { value: 'Recovery Specialist', label: 'Recovery Specialist' },
    { value: 'Customer Success Lead', label: 'Customer Success Lead' },
    { value: 'Compliance Officer', label: 'Compliance Officer' },
  ];

  readonly departmentOptions: SelectOption[] = [
    { value: '', label: 'Select a department' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Credit', label: 'Credit' },
    { value: 'Recovery', label: 'Recovery' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Customer Success', label: 'Customer Success' },
  ];

  readonly inviteEmailValid = computed(() => EMAIL_RE.test(this.inviteEmail().trim()));

  readonly inviteStepValid = computed(() => {
    switch (this.inviteStep()) {
      case 0: return !!this.inviteFirstName().trim() && !!this.inviteLastName().trim() && this.inviteEmailValid();
      case 1: return this.inviteRole() !== null;
      default: return true;
    }
  });

  openInviteSingle() {
    this.inviteMenuOpen.set(false);
    this.inviteStep.set(0);
    this.inviteFirstName.set('');
    this.inviteLastName.set('');
    this.inviteEmail.set('');
    this.inviteJobTitle.set('');
    this.inviteDepartment.set('');
    this.inviteRole.set(null);
    this.inviteAutoAssign.set(true);
    this.inviteMode.set('single');
  }

  openInviteMulti() {
    this.inviteMenuOpen.set(false);
    this.multiEmails.set('');
    this.multiRole.set('Loan Officer');
    this.multiAutoAssign.set(true);
    this.multiFormOpen.set(false);
    this.inviteMode.set('multi');
  }

  closeInviteOverlay() {
    this.inviteMode.set(null);
  }

  onEscape() {
    if (this.inviteMode()) this.closeInviteOverlay();
    else if (this.inviteMenuOpen()) this.inviteMenuOpen.set(false);
    else if (this.roleFilterOpen()) this.roleFilterOpen.set(false);
  }

  selectInviteRole(role: LendingRole) {
    this.inviteRole.set(role);
    if (this.isOfficerRole(role)) this.inviteAutoAssign.set(true);
  }

  inviteNext() {
    if (this.inviteStep() < 2 && this.inviteStepValid()) this.inviteStep.update((s) => s + 1);
  }

  inviteBack() {
    if (this.inviteStep() > 0) this.inviteStep.update((s) => s - 1);
  }

  private appendPendingMember(firstName: string, lastName: string, email: string, role: LendingRole, autoAssign: boolean, jobTitle = '', department = '') {
    const id = 'm' + Date.now() + Math.floor(Math.random() * 1000);
    const officer = this.isOfficerRole(role);
    const newMember: TeamMember = {
      id,
      firstName,
      lastName,
      email,
      phone: '',
      role: this.toServiceRole(role),
      status: 'pending',
      lastActive: '',
      loansAssigned: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
      statsProcessed: 0,
      statsDisbursed: '₦0',
      statsCollectionRate: 0,
      permissionGroups: this.permissionsFor(role),
      activity: [],
      assignedLoans: [],
    };
    this.members.update((all) => [newMember, ...all]);
    this.extras.update((all) => ({
      ...all,
      [id]: {
        role: role === 'Relationship Officer' ? 'Relationship Officer' : undefined,
        jobTitle,
        department,
        autoAssign: officer && autoAssign,
      },
    }));
  }

  sendInvite() {
    const role = this.inviteRole();
    if (!role || !this.inviteStepValid()) return;
    const firstName = this.inviteFirstName().trim();
    const email = this.inviteEmail().trim();
    const autoAssign = this.isOfficerRole(role) && this.inviteAutoAssign();
    this.appendPendingMember(firstName, this.inviteLastName().trim(), email, role, autoAssign, this.inviteJobTitle(), this.inviteDepartment());
    this.inviteMode.set(null);
    this.view.set('list');
    this.showToast(autoAssign
      ? `Invite sent to ${email}. ${firstName} will start receiving customer assignments automatically.`
      : `Invite sent to ${email}.`);
  }

  // ── Invite multiple users ──
  readonly multiEmails = signal('');
  readonly multiRole = signal<LendingRole>('Loan Officer');
  readonly multiAutoAssign = signal(true);
  readonly multiFormOpen = signal(false);

  readonly multiRoleOptions: SelectOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Loan Officer', label: 'Loan Officer' },
    { value: 'Relationship Officer', label: 'Relationship Officer' },
    { value: 'Auditor', label: 'Auditor' },
  ];

  readonly parsedMultiEmails = computed(() =>
    this.multiEmails()
      .split(/[\s,;\n]+/)
      .map((e) => e.trim())
      .filter((e) => EMAIL_RE.test(e)));

  setMultiRole(value: string) {
    this.multiRole.set(value as LendingRole);
    if (this.isOfficerRole(value)) this.multiAutoAssign.set(true);
  }

  toggleMultiForm() {
    this.multiFormOpen.update((v) => !v);
  }

  sendMultiInvites() {
    const emails = this.parsedMultiEmails();
    if (!emails.length) return;
    const role = this.multiRole();
    const officer = this.isOfficerRole(role);
    const autoAssign = officer && this.multiAutoAssign();
    for (const email of emails) {
      const local = email.split('@')[0];
      const first = (local.split(/[._-]/)[0] || 'Invited');
      const firstName = first.charAt(0).toUpperCase() + first.slice(1);
      this.appendPendingMember(firstName, '(Invited)', email, role, autoAssign);
    }
    this.inviteMode.set(null);
    this.view.set('list');
    const count = emails.length;
    this.showToast(autoAssign
      ? `${count} invite${count === 1 ? '' : 's'} sent. New officers will start receiving customer assignments automatically.`
      : `${count} invite${count === 1 ? '' : 's'} sent.`);
  }

  comingSoon(feature: string) {
    this.showToast(`${feature} is coming soon in this demo.`, 'Coming soon');
  }

  // ── Toast ──
  toastVisible = signal(false);
  toastTitle = signal('Done');
  toastMessage = signal('');

  private showToast(message: string, title = 'Done') {
    this.toastTitle.set(title);
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3500);
  }
}
