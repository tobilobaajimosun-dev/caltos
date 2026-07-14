import { Component, Input, Output, EventEmitter } from '@angular/core';
import { formatThousands } from '../../utils/number-format';

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
  /**
   * Money/amount/counter mode: renders `value` (plain digits, e.g. "500000") with thousand
   * separators ("500,000") and reformats live as the user types, while still emitting plain
   * digits via valueChange — consumers keep storing/parsing a clean number, only display
   * gets commas. Forces the native input to text (a native type="number" input strips commas).
   */
  @Input() commaFormat = false;
  @Output() valueChange = new EventEmitter<string>();

  focused = false;

  get displayValue(): string {
    return this.commaFormat ? formatThousands(this.value) : this.value;
  }

  get effectiveType(): string {
    return this.commaFormat ? 'text' : this.type;
  }

  onInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    this.value = this.commaFormat ? raw.replace(/[^\d]/g, '') : raw;
    this.valueChange.emit(this.value);
  }
}
