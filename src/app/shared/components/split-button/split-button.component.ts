import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
import { ChevronDownIcon } from '@hugeicons/core-free-icons';

export interface SplitButtonItem {
  id: string;
  label: string;
  icon?: IconData;
}

@Component({
  selector: 'app-split-button',
  standalone: true,
  imports: [HiIconComponent],
  templateUrl: './split-button.component.html',
  styleUrls: ['./split-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitButtonComponent {
  label = input('');
  icon = input<IconData | null>(null);
  items = input<SplitButtonItem[]>([]);
  itemSelected = output<string>();

  readonly chevronIcon: IconData = ChevronDownIcon as IconData;
  readonly open = signal(false);

  toggle() {
    this.open.update((v) => !v);
  }

  select(item: SplitButtonItem) {
    this.itemSelected.emit(item.id);
    this.open.set(false);
  }

  close() {
    this.open.set(false);
  }
}
