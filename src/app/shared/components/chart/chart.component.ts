import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ChartType = 'line' | 'bar';

export interface ChartDataPoint {
  label: string;
  value: number;
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

  readonly viewBox = `0 0 ${WIDTH} ${HEIGHT}`;
  readonly chartHeight = HEIGHT;
  readonly chartWidth = WIDTH;

  private readonly maxValue = computed(() => Math.max(1, ...this.data().map((d) => d.value)));

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
}
