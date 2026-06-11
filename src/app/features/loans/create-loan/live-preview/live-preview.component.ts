import { Component, Input } from '@angular/core';
import { LoanConfig } from '../create-loan.component';

@Component({
  selector: 'app-live-preview',
  standalone: true,
  templateUrl: './live-preview.component.html',
  styleUrls: ['./live-preview.component.scss'],
})
export class LivePreviewComponent {
  @Input() config!: LoanConfig;
  @Input() step = 0;

  get loanName(): string {
    return this.config?.name || 'My Loan Product';
  }

  get primaryColor(): string {
    return this.config?.brandColor || '#0053a6';
  }

  get showEntryStep(): boolean {
    return this.step >= 2;
  }

  get showVerificationStep(): boolean {
    return this.step >= 3;
  }

  get entryFields(): string[] {
    const fields: string[] = [];
    if (this.config?.entryPhone) fields.push('Phone Number');
    if (this.config?.entryEmail) fields.push('Email Address');
    if (this.config?.entryBvn) fields.push('BVN');
    if (this.config?.entryNin) fields.push('NIN');
    return fields.length ? fields : ['Phone Number', 'Email Address'];
  }

  get previewScreen(): 'welcome' | 'form' | 'verify' {
    if (this.step >= 3) return 'verify';
    if (this.step >= 1) return 'form';
    return 'welcome';
  }
}
