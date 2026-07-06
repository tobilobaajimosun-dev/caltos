import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ChartType = 'line' | 'bar' | 'grouped-bar' | 'area';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  name: string;
  color: string;
  data: ChartDataPoint[];
}

const WIDTH = 600;
const HEIGHT = 240;
const PADDING = 24;

@Component({
  selector: 'app-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
})
export class ChartComponent {
  type = input<ChartType>('line');
  data = input<ChartDataPoint[]>([]);
  color = input('var(--color-blue)');
  /** Used by 'grouped-bar' and stacked 'area' types — multiple named series sharing the same labels. */
  series = input<ChartSeries[]>([]);

  readonly viewBox = `0 0 ${WIDTH} ${HEIGHT}`;
  readonly chartHeight = HEIGHT;
  readonly chartWidth = WIDTH;

  private readonly maxValue = computed(() => Math.max(1, ...this.data().map((d) => d.value)));

  private readonly seriesMax = computed(() => {
    const s = this.series();
    if (!s.length) return 1;
    if (this.type() === 'area') {
      // stacked: max of the summed values across series at each index
      const len = s[0]?.data.length ?? 0;
      let max = 1;
      for (let i = 0; i < len; i++) {
        const total = s.reduce((sum, ser) => sum + (ser.data[i]?.value ?? 0), 0);
        max = Math.max(max, total);
      }
      return max;
    }
    return Math.max(1, ...s.flatMap((ser) => ser.data.map((d) => d.value)));
  });

  readonly points = computed(() => {
    const d = this.data();
    if (!d.length) return [];
    const step = (WIDTH - PADDING * 2) / Math.max(1, d.length - 1);
    const max = this.maxValue();
    return d.map((point, i) => ({
      x: PADDING + i * step,
      y: HEIGHT - PADDING - (point.value / max) * (HEIGHT - PADDING * 2),
      label: point.label,
      value: point.value,
    }));
  });

  readonly linePath = computed(() =>
    this.points().map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  );

  readonly bars = computed(() => {
    const d = this.data();
    if (!d.length) return [];
    const slot = (WIDTH - PADDING * 2) / d.length;
    const barWidth = Math.min(40, slot * 0.5);
    const max = this.maxValue();
    return d.map((point, i) => {
      const barHeight = (point.value / max) * (HEIGHT - PADDING * 2);
      return {
        x: PADDING + i * slot + (slot - barWidth) / 2,
        y: HEIGHT - PADDING - barHeight,
        width: barWidth,
        height: barHeight,
        label: point.label,
        value: point.value,
      };
    });
  });

  /** Grouped (side-by-side) bars — one cluster per label, one bar per series. */
  readonly groupedBars = computed(() => {
    const s = this.series();
    if (!s.length) return [];
    const len = s[0]?.data.length ?? 0;
    const slot = (WIDTH - PADDING * 2) / len;
    const groupWidth = slot * 0.7;
    const barWidth = groupWidth / s.length;
    const max = this.seriesMax();
    const out: { x: number; y: number; width: number; height: number; color: string; label: string; value: number }[] = [];
    for (let i = 0; i < len; i++) {
      const groupX = PADDING + i * slot + (slot - groupWidth) / 2;
      s.forEach((ser, si) => {
        const point = ser.data[i];
        if (!point) return;
        const barHeight = (point.value / max) * (HEIGHT - PADDING * 2);
        out.push({
          x: groupX + si * barWidth,
          y: HEIGHT - PADDING - barHeight,
          width: Math.max(2, barWidth - 2),
          height: barHeight,
          color: ser.color,
          label: point.label,
          value: point.value,
        });
      });
    }
    return out;
  });

  /** Stacked area layers — each series stacked on top of the previous one. */
  readonly areaLayers = computed(() => {
    const s = this.series();
    if (!s.length) return [];
    const len = s[0]?.data.length ?? 0;
    const step = (WIDTH - PADDING * 2) / Math.max(1, len - 1);
    const max = this.seriesMax();
    const runningTotals = new Array(len).fill(0);
    return s.map((ser) => {
      const topPoints = ser.data.map((point, i) => {
        runningTotals[i] += point.value;
        const y = HEIGHT - PADDING - (runningTotals[i] / max) * (HEIGHT - PADDING * 2);
        return { x: PADDING + i * step, y };
      });
      const baseline = HEIGHT - PADDING;
      const bottomPoints = topPoints
        .map((p, i) => ({ x: p.x, y: HEIGHT - PADDING - ((runningTotals[i] - ser.data[i].value) / max) * (HEIGHT - PADDING * 2) }))
        .reverse();
      const path =
        topPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') +
        ' ' +
        bottomPoints.map((p) => `L${p.x},${p.y}`).join(' ') +
        ` L${topPoints[0]?.x ?? PADDING},${baseline} Z`;
      return { name: ser.name, color: ser.color, path };
    });
  });
}
