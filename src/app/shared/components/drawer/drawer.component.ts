import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type DrawerPosition = 'left' | 'right';

@Component({
  selector: 'app-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class DrawerComponent {
  isOpen = input(false);
  title = input('');
  position = input<DrawerPosition>('right');
  width = input('420px');
  closed = output<void>();

  onEscape() {
    if (this.isOpen()) this.closed.emit();
  }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as Element).classList.contains('drawer-backdrop')) {
      this.closed.emit();
    }
  }
}
