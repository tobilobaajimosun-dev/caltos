import { Injectable, signal } from '@angular/core';

export type CustomerStatus = 'active' | 'overdue' | 'blacklisted' | 'inactive';
export type BvnStatus = 'verified' | 'pending';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface CustomerLoan {
  id: string;
  product: string;
  amount: string;
  disbursedDate: string;
  status: 'active' | 'overdue' | 'completed' | 'suspended';
  balance: string;
  nextRepayment: string;
}

export interface CustomerDoc {
  name: string;
  type: 'BVN' | 'NIN' | 'Pay Slip' | 'Utility Bill' | 'Bank Statement' | 'Government ID';
  uploadDate: string;
  status: 'verified' | 'pending' | 'rejected';
  expiry: string;
}

export interface CustomerRepayment {
  date: string;
  amount: string;
  method: string;
  reference: string;
  balanceAfter: string;
}

export interface CustomerNote {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface CustomerActivity {
  id: string;
  action: string;
  date: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  bvn: string;
  bvnStatus: BvnStatus;
  status: CustomerStatus;
  loanOfficer: string;
  product: string;
  location: string;
  registeredAt: string;
  activeLoans: number;
  outstandingBalance: string;
  lastActivity: string;
  dob: string;
  address: string;
  employer: string;
  salary: string;
  salaryAccount: string;
  linkedAccounts: { bank: string; accountNumber: string }[];
  riskScore: number;
  riskLevel: RiskLevel;
  walletBalance: string;
  loans: CustomerLoan[];
  kycDocs: CustomerDoc[];
  repayments: CustomerRepayment[];
  notes: CustomerNote[];
  activityLog: CustomerActivity[];
}

const STORAGE_KEY = 'caltos_customers';

function seedCustomers(): CustomerRecord[] {
  return [
    {
      id: 'CU-1001', name: 'Akpan Akporigomayen', email: 'akpan@princepsfinance.com', phone: '08031234567',
      bvn: '22134567890', bvnStatus: 'verified', status: 'active', loanOfficer: 'Fatima Abdallah',
      product: 'Corper Wallet', location: 'Lagos', registeredAt: '2025-11-02', activeLoans: 1,
      outstandingBalance: '₦30,000', lastActivity: '2026-07-04T09:15:00',
      dob: '1998-04-12', address: '12 Adeola Odeku St, Victoria Island, Lagos',
      employer: 'NYSC — Lagos State Secretariat', salary: '₦33,000/month', salaryAccount: '0123456789 · GTBank',
      linkedAccounts: [{ bank: 'GTBank', accountNumber: '0123456789' }],
      riskScore: 82, riskLevel: 'Low', walletBalance: '₦12,400',
      loans: [
        { id: 'CW001-L001', product: 'Corper Wallet', amount: '₦50,000', disbursedDate: '2026-06-11', status: 'active', balance: '₦30,000', nextRepayment: '2026-07-11' },
      ],
      kycDocs: [
        { name: 'BVN Verification', type: 'BVN', uploadDate: '2025-11-02', status: 'verified', expiry: '—' },
        { name: 'NYSC Call-up Letter', type: 'Government ID', uploadDate: '2025-11-02', status: 'verified', expiry: '2026-11-01' },
        { name: 'Utility Bill', type: 'Utility Bill', uploadDate: '2025-11-02', status: 'verified', expiry: '2026-05-02' },
      ],
      repayments: [
        { date: '2026-06-11', amount: '₦20,000', method: 'Auto-deduction', reference: 'RPY-88213', balanceAfter: '₦30,000' },
      ],
      notes: [
        { id: 'n1', author: 'Fatima Abdallah', text: 'Confirmed employment via NYSC portal. Good repayment history so far.', date: '2026-06-12' },
      ],
      activityLog: [
        { id: 'a1', action: 'Logged in from Lagos, NG', date: '2026-07-04T09:15:00' },
        { id: 'a2', action: 'Repayment of ₦20,000 processed', date: '2026-06-11T10:00:00' },
        { id: 'a3', action: 'Loan application approved — Corper Wallet', date: '2026-06-10T14:22:00' },
        { id: 'a4', action: 'Account created', date: '2025-11-02T08:00:00' },
      ],
    },
    {
      id: 'CU-1002', name: 'Bola Adebayo', email: 'bola@princepsfinance.com', phone: '08029876543',
      bvn: '22198765432', bvnStatus: 'verified', status: 'active', loanOfficer: 'Fatima Abdallah',
      product: 'Corper Wallet', location: 'Ogun', registeredAt: '2025-12-15', activeLoans: 1,
      outstandingBalance: '₦45,000', lastActivity: '2026-07-03T16:40:00',
      dob: '1999-08-23', address: '5 Kuto Rd, Abeokuta, Ogun State',
      employer: 'NYSC — Ogun State Secretariat', salary: '₦33,000/month', salaryAccount: '0987654321 · Access Bank',
      linkedAccounts: [{ bank: 'Access Bank', accountNumber: '0987654321' }],
      riskScore: 71, riskLevel: 'Medium', walletBalance: '₦4,200',
      loans: [
        { id: 'CW001-L002', product: 'Corper Wallet', amount: '₦70,000', disbursedDate: '2026-06-12', status: 'active', balance: '₦45,000', nextRepayment: '2026-07-12' },
      ],
      kycDocs: [
        { name: 'BVN Verification', type: 'BVN', uploadDate: '2025-12-15', status: 'verified', expiry: '—' },
        { name: 'NYSC Call-up Letter', type: 'Government ID', uploadDate: '2025-12-15', status: 'verified', expiry: '2026-12-14' },
      ],
      repayments: [
        { date: '2026-06-12', amount: '₦25,000', method: 'Auto-deduction', reference: 'RPY-88214', balanceAfter: '₦45,000' },
      ],
      notes: [],
      activityLog: [
        { id: 'a1', action: 'Repayment of ₦25,000 processed', date: '2026-06-12T10:00:00' },
        { id: 'a2', action: 'Account created', date: '2025-12-15T08:00:00' },
      ],
    },
    {
      id: 'CU-1003', name: 'Chika Okafor', email: 'chika@princepsfinance.com', phone: '08134567891',
      bvn: '22145678901', bvnStatus: 'verified', status: 'overdue', loanOfficer: 'Gideon Mbogo',
      product: 'Credit Wallet', location: 'Enugu', registeredAt: '2025-08-20', activeLoans: 1,
      outstandingBalance: '₦60,000', lastActivity: '2026-06-28T11:00:00',
      dob: '1994-01-30', address: '18 Ogui Rd, Enugu',
      employer: 'Zenith Bank Plc', salary: '₦280,000/month', salaryAccount: '2234567890 · Zenith Bank',
      linkedAccounts: [{ bank: 'Zenith Bank', accountNumber: '2234567890' }],
      riskScore: 48, riskLevel: 'High', walletBalance: '₦0',
      loans: [
        { id: 'CW001-L003', product: 'Credit Wallet', amount: '₦90,000', disbursedDate: '2026-06-13', status: 'overdue', balance: '₦60,000', nextRepayment: '2026-06-27 (overdue)' },
      ],
      kycDocs: [
        { name: 'BVN Verification', type: 'BVN', uploadDate: '2025-08-20', status: 'verified', expiry: '—' },
        { name: 'Pay Slip', type: 'Pay Slip', uploadDate: '2025-08-20', status: 'verified', expiry: '2026-02-20' },
        { name: 'Bank Statement (3 months)', type: 'Bank Statement', uploadDate: '2025-08-20', status: 'pending', expiry: '—' },
      ],
      repayments: [
        { date: '2026-05-13', amount: '₦30,000', method: 'Direct Debit', reference: 'RPY-88099', balanceAfter: '₦60,000' },
      ],
      notes: [
        { id: 'n1', author: 'Gideon Mbogo', text: 'Missed June repayment. Called twice, no response. Escalating to collections.', date: '2026-06-29' },
      ],
      activityLog: [
        { id: 'a1', action: 'Marked overdue — missed repayment', date: '2026-06-28T00:00:00' },
        { id: 'a2', action: 'Repayment of ₦30,000 processed', date: '2026-05-13T10:00:00' },
        { id: 'a3', action: 'Account created', date: '2025-08-20T08:00:00' },
      ],
    },
    {
      id: 'CU-1004', name: 'Damilola Ojo', email: 'damilola@princepsfinance.com', phone: '08145678912',
      bvn: '22156789012', bvnStatus: 'verified', status: 'active', loanOfficer: 'Gideon Mbogo',
      product: 'Corper Wallet', location: 'Oyo', registeredAt: '2026-01-10', activeLoans: 1,
      outstandingBalance: '₦75,000', lastActivity: '2026-07-02T13:20:00',
      dob: '2000-11-05', address: '30 Ring Rd, Ibadan',
      employer: 'NYSC — Oyo State Secretariat', salary: '₦33,000/month', salaryAccount: '3345678901 · UBA',
      linkedAccounts: [{ bank: 'UBA', accountNumber: '3345678901' }],
      riskScore: 76, riskLevel: 'Low', walletBalance: '₦8,900',
      loans: [
        { id: 'CW001-L004', product: 'Corper Wallet', amount: '₦110,000', disbursedDate: '2026-06-14', status: 'active', balance: '₦75,000', nextRepayment: '2026-07-14' },
      ],
      kycDocs: [
        { name: 'BVN Verification', type: 'BVN', uploadDate: '2026-01-10', status: 'verified', expiry: '—' },
        { name: 'NYSC Call-up Letter', type: 'Government ID', uploadDate: '2026-01-10', status: 'verified', expiry: '2027-01-09' },
      ],
      repayments: [],
      notes: [],
      activityLog: [
        { id: 'a1', action: 'Loan disbursed — ₦110,000', date: '2026-06-14T09:00:00' },
        { id: 'a2', action: 'Account created', date: '2026-01-10T08:00:00' },
      ],
    },
    {
      id: 'CU-1005', name: 'Emeka Nwosu', email: 'emeka@princepsfinance.com', phone: '08056781234',
      bvn: '22167890123', bvnStatus: 'pending', status: 'inactive', loanOfficer: 'Fatima Abdallah',
      product: '—', location: 'Rivers', registeredAt: '2026-02-18', activeLoans: 0,
      outstandingBalance: '₦0', lastActivity: '2026-05-01T10:00:00',
      dob: '1997-06-19', address: '9 Aba Rd, Port Harcourt',
      employer: 'Self-employed', salary: '—', salaryAccount: '—',
      linkedAccounts: [], riskScore: 60, riskLevel: 'Medium', walletBalance: '₦0',
      loans: [], kycDocs: [
        { name: 'BVN Verification', type: 'BVN', uploadDate: '2026-02-18', status: 'pending', expiry: '—' },
      ],
      repayments: [], notes: [],
      activityLog: [
        { id: 'a1', action: 'Account created, no loan applications yet', date: '2026-02-18T08:00:00' },
      ],
    },
    {
      id: 'CU-1006', name: 'Fatima Bello', email: 'fatima.bello@example.com', phone: '08167891235',
      bvn: '22178901234', bvnStatus: 'verified', status: 'blacklisted', loanOfficer: 'Gideon Mbogo',
      product: 'Credit Alert', location: 'Kano', registeredAt: '2025-04-05', activeLoans: 0,
      outstandingBalance: '₦120,000', lastActivity: '2026-03-15T09:00:00',
      dob: '1992-09-14', address: '4 Zoo Rd, Kano',
      employer: 'Kano State Civil Service', salary: '₦95,000/month', salaryAccount: '4456789012 · First Bank',
      linkedAccounts: [{ bank: 'First Bank', accountNumber: '4456789012' }],
      riskScore: 22, riskLevel: 'High', walletBalance: '₦0',
      loans: [
        { id: 'CA100-L009', product: 'Credit Alert', amount: '₦120,000', disbursedDate: '2025-10-01', status: 'overdue', balance: '₦120,000', nextRepayment: '2025-11-01 (overdue)' },
      ],
      kycDocs: [
        { name: 'BVN Verification', type: 'BVN', uploadDate: '2025-04-05', status: 'verified', expiry: '—' },
      ],
      repayments: [],
      notes: [
        { id: 'n1', author: 'Gideon Mbogo', text: 'Defaulted on loan, unresponsive to all contact attempts. Blacklisted per policy after 90 days past due.', date: '2026-03-15' },
      ],
      activityLog: [
        { id: 'a1', action: 'Blacklisted — 90+ days past due', date: '2026-03-15T00:00:00' },
        { id: 'a2', action: 'Loan disbursed — ₦120,000', date: '2025-10-01T09:00:00' },
        { id: 'a3', action: 'Account created', date: '2025-04-05T08:00:00' },
      ],
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly _customers = signal<CustomerRecord[]>(this.load());
  readonly customers = this._customers.asReadonly();

  private load(): CustomerRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return seedCustomers();
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._customers()));
  }

  getById(id: string): CustomerRecord | undefined {
    return this._customers().find((c) => c.id === id);
  }

  create(partial: Partial<CustomerRecord> & { name: string }): CustomerRecord {
    const record: CustomerRecord = {
      id: partial.id ?? 'CU-' + Date.now().toString().slice(-6),
      name: partial.name,
      email: partial.email ?? '',
      phone: partial.phone ?? '',
      bvn: partial.bvn ?? '',
      bvnStatus: partial.bvnStatus ?? 'pending',
      status: partial.status ?? 'active',
      loanOfficer: partial.loanOfficer ?? 'Unassigned',
      product: partial.product ?? '—',
      location: partial.location ?? '',
      registeredAt: partial.registeredAt ?? new Date().toISOString().slice(0, 10),
      activeLoans: partial.activeLoans ?? 0,
      outstandingBalance: partial.outstandingBalance ?? '₦0',
      lastActivity: partial.lastActivity ?? new Date().toISOString(),
      dob: partial.dob ?? '',
      address: partial.address ?? '',
      employer: partial.employer ?? '',
      salary: partial.salary ?? '',
      salaryAccount: partial.salaryAccount ?? '',
      linkedAccounts: partial.linkedAccounts ?? [],
      riskScore: partial.riskScore ?? 50,
      riskLevel: partial.riskLevel ?? 'Medium',
      walletBalance: partial.walletBalance ?? '₦0',
      loans: partial.loans ?? [],
      kycDocs: partial.kycDocs ?? [],
      repayments: partial.repayments ?? [],
      notes: partial.notes ?? [],
      activityLog: partial.activityLog ?? [{ id: 'a0', action: 'Account created', date: new Date().toISOString() }],
    };
    this._customers.update((list) => [...list, record]);
    this.persist();
    return record;
  }

  update(id: string, patch: Partial<CustomerRecord>) {
    this._customers.update((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    this.persist();
  }

  setStatus(id: string, status: CustomerStatus) {
    this.update(id, { status });
  }

  addNote(id: string, author: string, text: string) {
    const customer = this.getById(id);
    if (!customer) return;
    const note: CustomerNote = { id: 'n' + Date.now(), author, text, date: new Date().toISOString().slice(0, 10) };
    this.update(id, { notes: [note, ...customer.notes] });
  }

  remove(id: string) {
    this._customers.update((list) => list.filter((c) => c.id !== id));
    this.persist();
  }
}
