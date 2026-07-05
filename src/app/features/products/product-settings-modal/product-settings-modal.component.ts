import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent, ButtonComponent } from '../../../shared/components';

type SettingsSection = 'automations' | 'integrations' | 'approval' | 'documents' | 'notifications';

interface Automation {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  connected: boolean;
  initials: string;
}

@Component({
  selector: 'app-product-settings-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  templateUrl: './product-settings-modal.component.html',
  styleUrls: ['./product-settings-modal.component.scss'],
})
export class ProductSettingsModalComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  activeSection: SettingsSection = 'automations';

  readonly sections: { id: SettingsSection; label: string; description: string }[] = [
    { id: 'automations', label: 'Automations', description: 'Rule-based triggers' },
    { id: 'integrations', label: 'Integrations', description: 'Connect services' },
    { id: 'approval', label: 'Approval Workflows', description: 'Sign-off chains' },
    { id: 'documents', label: 'Document Types', description: 'Global doc library' },
    { id: 'notifications', label: 'Notifications', description: 'Message templates' },
  ];

  automations: Automation[] = [
    { id: 'reminder-3d', title: 'Due date reminder (3 days)', description: 'SMS/email to borrowers 3 days before repayment is due.', enabled: true },
    { id: 'reminder-1d', title: 'Due date reminder (1 day)', description: 'Final reminder 24 hours before the due date.', enabled: false },
    { id: 'overdue-flag', title: 'Auto-flag overdue loans', description: 'Mark loans overdue after 7 days of missed repayment.', enabled: true },
    { id: 'disburse-confirm', title: 'Disbursement confirmation', description: 'Notify borrowers when a loan is disbursed to their account.', enabled: true },
    { id: 'auto-deactivate', title: 'Idle product auto-deactivation', description: 'Deactivate products with zero disbursements for 90+ days.', enabled: false },
    { id: 'repayment-receipt', title: 'Repayment receipt', description: 'Send a receipt when a repayment is recorded against a loan.', enabled: true },
  ];

  readonly integrations: Integration[] = [
    { id: 'paystack', name: 'Paystack', description: 'Accept repayments and disburse via Paystack.', category: 'Payments', connected: true, initials: 'P' },
    { id: 'flutterwave', name: 'Flutterwave', description: 'Alternative gateway for collections and disbursements.', category: 'Payments', connected: false, initials: 'F' },
    { id: 'crc', name: 'CRC Credit Bureau', description: 'Pull credit reports and submit repayment data.', category: 'Credit Bureau', connected: false, initials: 'CR' },
    { id: 'firstcentral', name: 'FirstCentral', description: 'Credit bureau integration for risk assessment.', category: 'Credit Bureau', connected: false, initials: 'FC' },
    { id: 'termii', name: 'Termii', description: 'Send transactional SMS to borrowers via Termii.', category: 'Messaging', connected: true, initials: 'T' },
    { id: 'sendgrid', name: 'SendGrid', description: 'Send transactional email notifications.', category: 'Messaging', connected: false, initials: 'SG' },
  ];

  readonly approvalSteps = [
    { role: 'Loan Officer', action: 'Initial review & verification', required: true },
    { role: 'Credit Analyst', action: 'Credit assessment & scoring', required: true },
    { role: 'Branch Manager', action: 'Final approval (loans > ₦500k)', required: false },
  ];

  readonly documentTypes = [
    { name: 'National ID (NIN)', required: true, accepted: 'JPEG, PNG, PDF' },
    { name: 'Bank Verification Number (BVN)', required: true, accepted: 'Verified via API' },
    { name: 'Utility Bill', required: true, accepted: 'PDF, JPEG' },
    { name: 'Last 3 months payslip', required: false, accepted: 'PDF' },
    { name: '6-month bank statement', required: false, accepted: 'PDF' },
    { name: 'Employment letter', required: false, accepted: 'PDF, JPEG' },
  ];

  readonly notificationTemplates = [
    { event: 'Loan Approved', channel: 'SMS + Email', lastEdited: 'Jun 10, 2025' },
    { event: 'Loan Disbursed', channel: 'SMS + Email', lastEdited: 'Jun 10, 2025' },
    { event: 'Repayment Due (3 days)', channel: 'SMS', lastEdited: 'May 28, 2025' },
    { event: 'Repayment Due (1 day)', channel: 'SMS', lastEdited: 'May 28, 2025' },
    { event: 'Repayment Received', channel: 'SMS + Email', lastEdited: 'Jun 1, 2025' },
    { event: 'Loan Overdue', channel: 'SMS + Email', lastEdited: 'Jun 1, 2025' },
    { event: 'Application Received', channel: 'Email', lastEdited: 'Jun 5, 2025' },
  ];

  setSection(s: SettingsSection) { this.activeSection = s; }
  toggleAutomation(id: string) {
    const a = this.automations.find(x => x.id === id);
    if (a) a.enabled = !a.enabled;
  }
  close() { this.closed.emit(); }
}
