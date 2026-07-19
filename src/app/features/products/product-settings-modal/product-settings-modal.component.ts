import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalComponent, ButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-product-settings-modal',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  templateUrl: './product-settings-modal.component.html',
  styleUrls: ['./product-settings-modal.component.scss'],
})
export class ProductSettingsModalComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  readonly notificationTemplates = [
    { event: 'Loan Approved', channel: 'SMS + Email', lastEdited: 'Jun 10, 2025' },
    { event: 'Loan Disbursed', channel: 'SMS + Email', lastEdited: 'Jun 10, 2025' },
    { event: 'Repayment Due (3 days)', channel: 'SMS', lastEdited: 'May 28, 2025' },
    { event: 'Repayment Due (1 day)', channel: 'SMS', lastEdited: 'May 28, 2025' },
    { event: 'Repayment Received', channel: 'SMS + Email', lastEdited: 'Jun 1, 2025' },
    { event: 'Loan Overdue', channel: 'SMS + Email', lastEdited: 'Jun 1, 2025' },
    { event: 'Application Received', channel: 'Email', lastEdited: 'Jun 5, 2025' },
  ];

  close() { this.closed.emit(); }
}
