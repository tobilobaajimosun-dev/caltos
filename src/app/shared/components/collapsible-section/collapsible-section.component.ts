import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
import { ChevronDownIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-collapsible-section',
  standalone: true,
  imports: [HiIconComponent],
  template: `
    <div class="section" [class.open]="expanded">
      <button class="section-header" (click)="toggle()">
        <div class="header-left">
          <span class="section-title">{{ title }}</span>
          @if (subtitle) {
            <span class="section-sub">{{ subtitle }}</span>
          }
        </div>
        <hi-icon [icon]="chevron" size="16" color="var(--color-grey-header)" class="chevron" [class.rotated]="expanded" />
      </button>
      @if (expanded) {
        <div class="section-body">
          <ng-content />
        </div>
      }
    </div>
  `,
  styles: [`
    .section {
      border: 1px solid var(--color-stroke); border-radius: 10px; overflow: hidden;
    }
    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: 14px 16px; background: #fff; border: none; cursor: pointer;
      text-align: left;
      &:hover { background: #fafafa; }
    }
    .header-left { display: flex; flex-direction: column; gap: 2px; }
    .section-title { font-size: 14px; font-weight: 600; color: var(--color-header); }
    .section-sub { font-size: 12px; color: var(--color-grey-header); }
    .chevron { transition: transform 0.2s; flex-shrink: 0; }
    .chevron.rotated { transform: rotate(180deg); }
    .section-body {
      padding: 16px; border-top: 1px solid var(--color-stroke); background: #fafafa;
    }
  `]
})
export class CollapsibleSectionComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() expanded = false;
  @Output() expandedChange = new EventEmitter<boolean>();

  readonly chevron: IconData = ChevronDownIcon as IconData;

  toggle() {
    this.expanded = !this.expanded;
    this.expandedChange.emit(this.expanded);
  }
}
