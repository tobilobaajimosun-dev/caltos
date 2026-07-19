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
  /** Numeric series — when set, renders a smooth scaled mini-chart instead of raw sparkPoints. */
  @Input() sparkData: number[] = [];

  private get sparkCoords(): { x: number; y: number }[] {
    const d = this.sparkData;
    if (d.length < 2) return [];
    const min = Math.min(...d);
    const max = Math.max(...d);
    const range = max - min || 1;
    const step = 72 / (d.length - 1);
    // 4px vertical padding so the curve never clips the 36px-tall viewBox
    return d.map((v, i) => ({ x: i * step, y: 32 - ((v - min) / range) * 28 }));
  }

  get sparkPath(): string {
    const pts = this.sparkCoords;
    if (!pts.length) return '';
    let path = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      path += ` C${cx},${pts[i - 1].y} ${cx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
    }
    return path;
  }

  /** Optional full-bleed footer strip (e.g. "In Count" / 100). */
  @Input() countLabel = '';
  @Input() countValue: string | number = '';
}
