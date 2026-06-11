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
  @Output() valueChange = new EventEmitter<string>();

  focused = false;

  onInput(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
    this.valueChange.emit(this.value);
  }
}
