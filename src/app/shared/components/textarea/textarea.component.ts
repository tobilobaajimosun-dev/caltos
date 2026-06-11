import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (label) {
      <label class="field-label">{{ label }}</label>
    }
    <textarea
      class="textarea-field"
      [rows]="rows"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [(ngModel)]="value"
      (ngModelChange)="valueChange.emit($event)">
    </textarea>
    @if (hint) {
      <span class="field-hint">{{ hint }}</span>
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 500; color: var(--color-header); }
    .textarea-field {
      width: 100%; box-sizing: border-box;
      border: 1px solid var(--color-input-stroke);
      border-radius: 8px; padding: 10px 12px;
      font-family: var(--font-body); font-size: 13px; color: var(--color-header);
      resize: vertical; outline: none; transition: border-color 0.15s;
      &::placeholder { color: var(--color-grey-header); }
      &:focus { border-color: var(--color-blue); }
      &:disabled { background: #f9fafb; color: var(--color-grey-header); cursor: not-allowed; }
    }
    .field-hint { font-size: 11px; color: var(--color-grey-header); }
  `]
})
export class TextareaComponent {
  @Input() value = '';
  @Input() placeholder = '';
  @Input() label = '';
  @Input() hint = '';
  @Input() rows = 4;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<string>();
}
