import { Component, Input } from '@angular/core';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
import { CheckIcon, Copy01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-copy-url-field',
  standalone: true,
  imports: [HiIconComponent],
  template: `
    @if (label) {
      <label class="field-label">{{ label }}</label>
    }
    <div class="copy-wrap">
      <input class="url-input" [value]="url" readonly />
      <button class="copy-btn" [class.copied]="copied" (click)="copy()">
        <hi-icon [icon]="copied ? checkIcon : copyIcon" size="14" color="currentColor" />
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 500; color: var(--color-header); }
    .copy-wrap {
      display: flex; align-items: center;
      border: 1px solid var(--color-input-stroke); border-radius: 8px; overflow: hidden;
    }
    .url-input {
      flex: 1; border: none; outline: none; padding: 10px 12px;
      font-family: var(--font-body); font-size: 13px; color: var(--color-body);
      background: #f9fafb;
    }
    .copy-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 16px; border: none; border-left: 1px solid var(--color-input-stroke);
      background: #fff; font-family: var(--font-body); font-size: 13px;
      color: var(--color-blue); font-weight: 500; cursor: pointer; white-space: nowrap;
      transition: background 0.15s;
      &:hover { background: #f0f5ff; }
      &.copied { color: #059669; }
    }
  `]
})
export class CopyUrlFieldComponent {
  @Input() url = '';
  @Input() label = '';
  copied = false;

  readonly copyIcon: IconData = Copy01Icon as IconData;
  readonly checkIcon: IconData = CheckIcon as IconData;

  copy() {
    navigator.clipboard.writeText(this.url).catch(() => {});
    this.copied = true;
    setTimeout(() => this.copied = false, 2000);
  }
}
