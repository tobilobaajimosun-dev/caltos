import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-input',
  standalone: true,
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent {
  @Input() value = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() label = '';
  @Input() disabled = false;
  /** Text shown fixed inside the input's left edge, e.g. '₦' on amount fields. */
  @Input() prefix = '';
  /** Text shown fixed inside the input's right edge, e.g. '%' on rate fields. */
  @Input() suffix = '';
  @Output() valueChange = new EventEmitter<string>();

  focused = false;

  onInput(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
    this.valueChange.emit(this.value);
  }
}
