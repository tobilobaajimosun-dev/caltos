import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-radio-button',
  standalone: true,
  templateUrl: './radio-button.component.html',
  styleUrls: ['./radio-button.component.scss']
})
export class RadioButtonComponent {
  @Input() selected = false;
  @Input() label = '';
  @Output() selectedChange = new EventEmitter<boolean>();

  select() {
    if (!this.selected) {
      this.selected = true;
      this.selectedChange.emit(true);
    }
  }
}
