import { ChangeDetectionStrategy, Component } from '@angular/core';

interface ReportDef {
  title: string;
  description: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  readonly reports: ReportDef[] = [
    { title: 'Loan Performance', description: 'Disbursements, repayments, and default rates by product.' },
    { title: 'Collections Summary', description: 'Overdue accounts, recovery rates, and aging analysis.' },
    { title: 'Customer Growth', description: 'New applications, approvals, and customer retention.' },
    { title: 'Wallet & Payouts', description: 'Wallet funding, disbursement volume, and payout activity.' },
    { title: 'Product Mix', description: 'Portfolio breakdown by loan product and channel.' },
    { title: 'Compliance & Audit', description: 'KYC completion, document verification, and audit trail exports.' },
  ];
}
