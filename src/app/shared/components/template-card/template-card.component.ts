import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';

@Component({
  selector: 'app-template-card',
  standalone: true,
  imports: [HiIconComponent],
  template: `
    <button
      class="template-card"
      [class.selected]="selected"
      [class.scratch]="isScratch"
      (click)="selectedChange.emit(true)">
      <div class="card-icon">
        <hi-icon [icon]="icon" [size]="22" [color]="selected ? 'var(--color-blue)' : 'var(--color-body)'" />
      </div>
      <span class="card-title">{{ title }}</span>
      @if (selected) {
        <span class="check-mark">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="var(--color-blue)"/>
            <path d="M5 8.5l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      }
    </button>
  `,
  styles: [`
    .template-card {
      position: relative;
      display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
      width: 100%; padding: 18px 16px; border-radius: 12px; cursor: pointer; text-align: left;
      border: 1.5px solid var(--color-stroke); background: #fff;
      transition: border-color 0.15s, box-shadow 0.15s;
      &:hover:not(.selected) { border-color: #c5cfe0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
      &.selected {
        border-color: var(--color-blue);
        background: rgba(0, 83, 166, 0.03);
        box-shadow: 0 0 0 3px rgba(0, 83, 166, 0.1);
      }
      &.scratch {
        border-style: dashed;
        background: #fafafa;
      }
    }
    .card-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: #f0f5ff;
    }
    .selected .card-icon { background: rgba(0, 83, 166, 0.08); }
    .card-title {
      font-family: var(--font-body); font-size: 13px; font-weight: 600;
      color: var(--color-header); line-height: 1.3;
    }
    .check-mark {
      position: absolute; top: 12px; right: 12px;
    }
  `]
})
export class TemplateCardComponent {
  @Input() title = '';
  @Input() icon: IconData = [];
  @Input() selected = false;
  @Input() isScratch = false;
  @Output() selectedChange = new EventEmitter<boolean>();
}
