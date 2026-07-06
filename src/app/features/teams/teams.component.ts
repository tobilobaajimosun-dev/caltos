import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
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
  PermissionItem,
  ColumnTitleComponent,
  TableItemComponent,
  TableItemUser,
  ConfirmModalComponent,
  ToastComponent,
} from '../../shared/components';

type Role = 'Admin' | 'Loan Officer' | 'Manager' | 'Auditor' | 'Custom';
type MemberStatus = 'active' | 'pending' | 'suspended';

interface PermissionGroupDef {
  groupName: string;
  permissions: PermissionItem[];
}

interface ActivityEntry {
  at: string;
  action: string;
}

interface AssignedLoan {
  loanId: string;
  customer: string;
  amount: string;
  status: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  status: MemberStatus;
  lastActive: string;
  loansAssigned: number;
  joinedDate: string;
  statsProcessed: number;
  statsDisbursed: string;
  statsCollectionRate: number;
  permissionGroups: PermissionGroupDef[];
  activity: ActivityEntry[];
  assignedLoans: AssignedLoan[];
}

const PERMISSION_TEMPLATE: { groupName: string; ids: string[] }[] = [
  { groupName: 'Customers', ids: ['view', 'edit', 'delete', 'export'] },
  { groupName: 'Loans', ids: ['view', 'create', 'approve', 'disburse', 'write-off'] },
  { groupName: 'Products', ids: ['view', 'create', 'edit', 'activate'] },
  { groupName: 'Reports', ids: ['view', 'export', 'schedule'] },
  { groupName: 'Wallet', ids: ['view', 'top-up', 'withdraw'] },
  { groupName: 'Settings', ids: ['view', 'edit'] },
  { groupName: 'Teams', ids: ['view', 'manage'] },
];

const ROLE_PRESETS: Record<Exclude<Role, 'Custom'>, Record<string, string[]>> = {
  'Admin': {
    Customers: ['view', 'edit', 'delete', 'export'], Loans: ['view', 'create', 'approve', 'disburse', 'write-off'],
    Products: ['view', 'create', 'edit', 'activate'], Reports: ['view', 'export', 'schedule'],
    Wallet: ['view', 'top-up', 'withdraw'], Settings: ['view', 'edit'], Teams: ['view', 'manage'],
  },
  'Manager': {
    Customers: ['view', 'edit', 'export'], Loans: ['view', 'approve', 'disburse'],
    Products: ['view'], Reports: ['view', 'export', 'schedule'],
    Wallet: ['view'], Settings: ['view'], Teams: ['view'],
  },
  'Loan Officer': {
    Customers: ['view', 'edit'], Loans: ['view', 'create'],
    Products: ['view'], Reports: ['view'],
    Wallet: [], Settings: [], Teams: [],
  },
  'Auditor': {
    Customers: ['view'], Loans: ['view'],
    Products: ['view'], Reports: ['view', 'export'],
    Wallet: ['view'], Settings: ['view'], Teams: ['view'],
  },
};

function buildPermissionGroups(role: Role): PermissionGroupDef[] {
  const preset = role === 'Custom' ? {} : ROLE_PRESETS[role];
  return PERMISSION_TEMPLATE.map((group) => ({
    groupName: group.groupName,
    permissions: group.ids.map((id) => ({
      id,
      label: id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
      selected: role === 'Custom' ? false : (preset[group.groupName] ?? []).includes(id),
    })),
  }));
}

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    AvatarComponent, StatusBadgeComponent, RoundTabsComponent, DrawerComponent, ModalComponent,
    SelectComponent, InputComponent, ButtonComponent, PermissionGroupComponent, ColumnTitleComponent,
    TableItemComponent, ConfirmModalComponent, ToastComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
})
export class TeamsComponent {
  readonly filterTabs: Tab[] = [
    { label: 'All', value: 'all' },
    { label: 'Admins', value: 'Admin' },
    { label: 'Loan Officers', value: 'Loan Officer' },
    { label: 'Managers', value: 'Manager' },
    { label: 'Auditors', value: 'Auditor' },
    { label: 'Suspended', value: 'suspended' },
  ];
  readonly activeFilter = signal('all');
  setFilter(v: string) {
    this.activeFilter.set(v);
  }

  readonly members = signal<TeamMember[]>([
    {
      id: 'm1', firstName: 'Jesulademi', lastName: 'Ajimosun', email: 'jesulademi.ajimosun@princepsfinance.com', phone: '0803 000 0001',
      role: 'Admin', status: 'active', lastActive: new Date().toISOString(), loansAssigned: 0, joinedDate: '2024-08-29',
      statsProcessed: 0, statsDisbursed: '₦0', statsCollectionRate: 0,
      permissionGroups: buildPermissionGroups('Admin'),
      activity: [{ at: '2026-07-06', action: 'Logged in' }],
      assignedLoans: [],
    },
    {
      id: 'm2', firstName: 'Tunde', lastName: 'Adeyemi', email: 'tunde.adeyemi@princepsfinance.com', phone: '0803 111 2222',
      role: 'Loan Officer', status: 'active', lastActive: '2026-07-05T10:00:00Z', loansAssigned: 18, joinedDate: '2025-01-15',
      statsProcessed: 142, statsDisbursed: '₦18,400,000', statsCollectionRate: 94.2,
      permissionGroups: buildPermissionGroups('Loan Officer'),
      activity: [
        { at: '2026-07-05 09:12', action: 'Approved loan LN-88213' },
        { at: '2026-07-04 14:30', action: 'Added customer Chika Okafor' },
      ],
      assignedLoans: [
        { loanId: 'LN-88213', customer: 'Chika Okafor', amount: '₦320,000', status: 'Active' },
        { loanId: 'LN-88190', customer: 'Gideon Mbogo', amount: '₦210,000', status: 'Overdue' },
      ],
    },
    {
      id: 'm3', firstName: 'Bisi', lastName: 'Nwachukwu', email: 'bisi.nwachukwu@princepsfinance.com', phone: '0803 222 3333',
      role: 'Manager', status: 'active', lastActive: '2026-07-05T16:00:00Z', loansAssigned: 6, joinedDate: '2024-11-02',
      statsProcessed: 302, statsDisbursed: '₦42,000,000', statsCollectionRate: 91.6,
      permissionGroups: buildPermissionGroups('Manager'),
      activity: [{ at: '2026-07-05 16:02', action: 'Approved dual-level loan LN-1002' }],
      assignedLoans: [{ loanId: 'LN-88052', customer: 'Ronke Balogun', amount: '₦150,000', status: 'Written Off' }],
    },
    {
      id: 'm4', firstName: 'Kemi', lastName: 'Suleiman', email: 'kemi.suleiman@princepsfinance.com', phone: '0803 333 4444',
      role: 'Auditor', status: 'pending', lastActive: '', loansAssigned: 0, joinedDate: '2026-07-04',
      statsProcessed: 0, statsDisbursed: '₦0', statsCollectionRate: 0,
      permissionGroups: buildPermissionGroups('Auditor'),
      activity: [],
      assignedLoans: [],
    },
    {
      id: 'm5', firstName: 'Bode', lastName: 'Okafor', email: 'bode.okafor@princepsfinance.com', phone: '0803 444 5555',
      role: 'Loan Officer', status: 'suspended', lastActive: '2026-06-01T09:00:00Z', loansAssigned: 3, joinedDate: '2025-03-10',
      statsProcessed: 58, statsDisbursed: '₦6,200,000', statsCollectionRate: 68.4,
      permissionGroups: buildPermissionGroups('Loan Officer'),
      activity: [{ at: '2026-06-01 09:00', action: 'Account suspended by Admin' }],
      assignedLoans: [{ loanId: 'LN-88077', customer: 'Emeka Nwosu', amount: '₦45,000', status: 'Active' }],
    },
  ]);

  readonly filteredMembers = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.members();
    if (filter === 'suspended') return this.members().filter((m) => m.status === 'suspended');
    return this.members().filter((m) => m.role === filter);
  });

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

  // ── Suspend / remove ──
  confirmTarget = signal<TeamMember | null>(null);
  confirmAction = signal<'suspend' | 'reactivate' | 'remove' | null>(null);

  requestSuspend(member: TeamMember) {
    this.confirmTarget.set(member);
    this.confirmAction.set(member.status === 'suspended' ? 'reactivate' : 'suspend');
  }

  requestRemove(member: TeamMember) {
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
    this.showToast(`Invite resent to ${member.email}.`);
  }

  reassignLoan(member: TeamMember, loan: AssignedLoan) {
    this.showToast(`${loan.loanId} reassignment started.`);
  }

  // ── Invite modal (3 steps) ──
  showInviteModal = signal(false);
  inviteStep = signal(0);

  inviteFirstName = signal('');
  inviteLastName = signal('');
  inviteEmail = signal('');
  invitePhone = signal('');
  inviteRole = signal<Role>('Loan Officer');
  invitePermissionGroups = signal<PermissionGroupDef[]>(buildPermissionGroups('Loan Officer'));

  readonly roleOptions: SelectOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Loan Officer', label: 'Loan Officer' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Auditor', label: 'Auditor' },
    { value: 'Custom', label: 'Custom' },
  ];

  readonly roleDescriptions: Record<Role, string> = {
    'Admin': 'Full access — can manage team, settings, and every module.',
    'Manager': 'Approve loans, view all reports. No settings access.',
    'Loan Officer': 'Create and process own loans, view own customers.',
    'Auditor': 'View-only access across all modules, can export reports.',
    'Custom': 'Build a bespoke permission set from scratch.',
  };

  readonly isPredefinedRole = computed(() => this.inviteRole() !== 'Custom');

  openInvite() {
    this.inviteStep.set(0);
    this.inviteFirstName.set('');
    this.inviteLastName.set('');
    this.inviteEmail.set('');
    this.invitePhone.set('');
    this.inviteRole.set('Loan Officer');
    this.invitePermissionGroups.set(buildPermissionGroups('Loan Officer'));
    this.showInviteModal.set(true);
  }

  closeInvite() {
    this.showInviteModal.set(false);
  }

  setInviteRole(role: string) {
    this.inviteRole.set(role as Role);
    this.invitePermissionGroups.set(buildPermissionGroups(role as Role));
  }

  updateGroupPermissions(groupName: string, permissions: PermissionItem[]) {
    this.invitePermissionGroups.update((groups) => groups.map((g) => (g.groupName === groupName ? { ...g, permissions } : g)));
  }

  inviteNext() {
    if (this.inviteStep() < 2) this.inviteStep.update((s) => s + 1);
  }

  inviteBack() {
    if (this.inviteStep() > 0) this.inviteStep.update((s) => s - 1);
  }

  get invitePermissionSummary(): string {
    const total = this.invitePermissionGroups().reduce((sum, g) => sum + g.permissions.filter((p) => p.selected).length, 0);
    return `${total} permission${total === 1 ? '' : 's'} across ${this.invitePermissionGroups().length} groups`;
  }

  sendInvite() {
    const newMember: TeamMember = {
      id: 'm' + Date.now(),
      firstName: this.inviteFirstName() || 'New',
      lastName: this.inviteLastName() || 'Member',
      email: this.inviteEmail(),
      phone: this.invitePhone(),
      role: this.inviteRole(),
      status: 'pending',
      lastActive: '',
      loansAssigned: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
      statsProcessed: 0,
      statsDisbursed: '₦0',
      statsCollectionRate: 0,
      permissionGroups: this.invitePermissionGroups(),
      activity: [],
      assignedLoans: [],
    };
    this.members.update((all) => [newMember, ...all]);
    this.showInviteModal.set(false);
    this.showToast(`Invite sent to ${newMember.email}.`);
  }

  // ── Toast ──
  toastVisible = signal(false);
  toastMessage = signal('');

  private showToast(message: string) {
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
