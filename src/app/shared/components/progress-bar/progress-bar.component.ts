import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
})
export class ProgressBarComponent {
  value = input(0);
  max = input(100);
  label = input('');
  color = input('var(--color-blue)');

  readonly percent = computed(() => Math.min(100, Math.max(0, (this.value() / (this.max() || 1)) * 100)));
}
