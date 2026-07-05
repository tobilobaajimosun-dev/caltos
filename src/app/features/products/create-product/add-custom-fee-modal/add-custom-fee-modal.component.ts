import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components';

export interface CustomFee {
  name: string;
  method: string;
  amount: string;
  applyTo: string;
}

@Component({
  selector: 'app-add-custom-fee-modal',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './add-custom-fee-modal.component.html',
  styleUrls: ['./add-custom-fee-modal.component.scss']
})
export class AddCustomFeeModalComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() added = new EventEmitter<CustomFee>();

  name = '';
  method = 'Fixed amount';
  amount = '';
  applyTo = 'Interest';

  submit() {
    this.added.emit({ name: this.name, method: this.method, amount: this.amount, applyTo: this.applyTo });
    this.reset();
    this.closed.emit();
  }

  close() { this.reset(); this.closed.emit(); }

  reset() {
    this.name = ''; this.method = 'Fixed amount'; this.amount = ''; this.applyTo = 'Interest';
  }
}
