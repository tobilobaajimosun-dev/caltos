import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
}

export interface CommandGroup {
  label: string;
  items: CommandItem[];
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class CommandPaletteComponent {
  isOpen = input(false);
  groups = input<CommandGroup[]>([]);

  closed = output<void>();
  selected = output<string>();

  readonly query = signal('');

  readonly filteredGroups = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.groups();
    return this.groups()
      .map((g) => ({ label: g.label, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  });

  onEscape() {
    if (this.isOpen()) this.closed.emit();
  }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as Element).classList.contains('cmdk-backdrop')) {
      this.closed.emit();
    }
  }

  choose(id: string) {
    this.selected.emit(id);
    this.closed.emit();
  }
}
