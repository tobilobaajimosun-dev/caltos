import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

const PALETTE = ['#0053A6', '#E55A2B', '#7C3AED', '#16A34A', '#D97706', '#DC2626'];

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  name = input('');
  color = input<string | undefined>(undefined);
  size = input<AvatarSize>('md');

  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  });

  readonly resolvedColor = computed(() => {
    if (this.color()) return this.color()!;
    const n = this.name();
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash);
    return PALETTE[Math.abs(hash) % PALETTE.length];
  });
}
