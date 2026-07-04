import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonVariant = 'block' | 'inline' | 'avatar';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="skeleton" [class]="'variant-' + variant()" [style.width]="width()" [style.height]="height()"></div>`,
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  variant = input<SkeletonVariant>('block');
  width = input('100%');
  height = input('16px');
}
