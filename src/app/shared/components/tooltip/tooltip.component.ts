import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="tooltip-host" [attr.data-pos]="position">
      <ng-content></ng-content>
      <span class="tooltip-box" role="tooltip">{{ text }}</span>
    </span>
  `,
  styleUrls: ['./tooltip.component.scss'],
})
export class TooltipComponent {
  @Input() text = '';
  @Input() position: TooltipPosition = 'top';
}
