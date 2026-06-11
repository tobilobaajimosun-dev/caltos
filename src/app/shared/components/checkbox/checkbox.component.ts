import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss']
})
export class CheckboxComponent {
  @Input() checked = false;
  @Input() label = '';
  @Input() variant: 'square' | 'round' = 'square';
  @Output() checkedChange = new EventEmitter<boolean>();

  toggle() {
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
  }
}
