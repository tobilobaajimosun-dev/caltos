import { Component, Input } from '@angular/core';
import { InfoPopoverComponent } from '../info-popover/info-popover.component';

export interface KpiTrend {
  dir: 'up' | 'down';
  value: number;
}

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [InfoPopoverComponent],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() subtitle = '';
  /** @deprecated use `helpText` instead. Still supported as a fallback. */
  @Input() tooltip = '';
  /** Popover heading; defaults to `label` when omitted. */
  @Input() helpTitle = '';
  /** Popover body copy. When empty (and `tooltip` is also empty) no info icon is rendered. */
  @Input() helpText = '';

  get resolvedHelpTitle(): string {
    return this.helpTitle || this.label;
  }

  get resolvedHelpText(): string {
    return this.helpText || this.tooltip;
  }

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
