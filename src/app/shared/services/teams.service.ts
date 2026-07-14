import { Injectable, signal } from '@angular/core';
import { PermissionItem } from '../components';

export type Role = 'Admin' | 'Loan Officer' | 'Manager' | 'Auditor' | 'Custom';
export type MemberStatus = 'active' | 'pending' | 'suspended';

export interface PermissionGroupDef {
  groupName: string;
  permissions: PermissionItem[];
}

export interface ActivityEntry {
  at: string;
  action: string;
}

export interface AssignedLoan {
  loanId: string;
  customer: string;
  amount: string;
  status: string;
}

export interface TeamMember {
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

export function buildPermissionGroups(role: Role): PermissionGroupDef[] {
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

/** Single source of truth for team members — used by TeamsComponent and anywhere else
 * (e.g. product-level notification recipient pickers) that needs to reference staff. */
@Injectable({ providedIn: 'root' })
export class TeamsService {
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
}
