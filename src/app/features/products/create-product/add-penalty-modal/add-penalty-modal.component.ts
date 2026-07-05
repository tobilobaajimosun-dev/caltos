import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components';

export interface PenaltyEntry {
  name: string;
  method: string;
  value: string;
  minAmount: string;
  maxAmount: string;
  kicksInAfter: string;
  kicksInUnit: 'Days' | 'Month';
  applyTo: string;
}

@Component({
  selector: 'app-add-penalty-modal',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './add-penalty-modal.component.html',
  styleUrls: ['./add-penalty-modal.component.scss']
})
export class AddPenaltyModalComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() added = new EventEmitter<PenaltyEntry>();

  name = '';
  method = 'Percentage';
  value = '';
  minAmount = '';
  maxAmount = '';
  kicksInAfter = '';
  kicksInUnit: 'Days' | 'Month' = 'Days';
  applyTo = 'Interest';

  submit() {
    this.added.emit({
      name: this.name, method: this.method, value: this.value,
      minAmount: this.minAmount, maxAmount: this.maxAmount,
      kicksInAfter: this.kicksInAfter, kicksInUnit: this.kicksInUnit,
      applyTo: this.applyTo,
    });
    this.reset();
    this.closed.emit();
  }

  close() { this.reset(); this.closed.emit(); }

  reset() {
    this.name = ''; this.method = 'Percentage'; this.value = '';
    this.minAmount = ''; this.maxAmount = ''; this.kicksInAfter = '';
    this.kicksInUnit = 'Days'; this.applyTo = 'Interest';
  }
}
