import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
import { ChevronDownIcon, CheckIcon } from '@hugeicons/core-free-icons';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [HiIconComponent],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent {
  options = input<SelectOption[]>([]);
  value = input<string>('');
  valueChange = output<string>();

  readonly chevronIcon: IconData = ChevronDownIcon as IconData;
  readonly checkIcon: IconData = CheckIcon as IconData;

  readonly open = signal(false);

  // Fewer than 2 options means there's nothing to choose between — render a static pill instead of a fake dropdown.
  readonly isStatic = computed(() => this.options().length <= 1);

  readonly selectedLabel = computed(() => {
    const opt = this.options().find((o) => o.value === this.value());
    return opt?.label ?? this.value();
  });

  toggle() {
    if (this.isStatic()) return;
    this.open.update((v) => !v);
  }

  select(opt: SelectOption) {
    this.valueChange.emit(opt.value);
    this.open.set(false);
  }

  close() {
    this.open.set(false);
  }
}
