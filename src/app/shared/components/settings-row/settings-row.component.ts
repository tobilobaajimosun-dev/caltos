import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type SettingsRowType = 'text' | 'email' | 'color' | 'toggle';

@Component({
  selector: 'app-settings-row',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings-row.component.html',
  styleUrls: ['./settings-row.component.scss']
})
export class SettingsRowComponent {
  @Input() type: SettingsRowType = 'text';
  @Input() label = '';
  @Input() subtitle = '';
  @Input() value = '';
  @Input() toggled = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() toggleChange = new EventEmitter<boolean>();

  editing = false;
  editValue = '';

  startEdit() {
    this.editValue = this.value;
    this.editing = true;
  }

  save() {
    this.value = this.editValue;
    this.valueChange.emit(this.value);
    this.editing = false;
  }

  cancel() {
    this.editing = false;
  }
}
