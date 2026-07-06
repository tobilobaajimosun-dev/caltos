import { Component, Input } from '@angular/core';
import { TooltipComponent } from '../tooltip/tooltip.component';

export interface KpiTrend {
  dir: 'up' | 'down';
  value: number;
}

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [TooltipComponent],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() subtitle = '';
  @Input() tooltip = '';

  /** Optional trend chip (e.g. "40% vs yesterday") shown below the value. */
  @Input() trend: KpiTrend | null = null;
  @Input() trendLabel = 'vs yesterday';
  /** Stroke color for the sparkline; only rendered when both trend and sparkPoints are set. */
  @Input() trendColor = '';
  /** SVG polyline points (viewBox 0 0 72 36) for the trend sparkline. */
  @Input() sparkPoints = '';

  /** Optional full-bleed footer strip (e.g. "In Count" / 100). */
  @Input() countLabel = '';
  @Input() countValue: string | number = '';
}
