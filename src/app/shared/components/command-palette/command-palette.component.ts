import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fuzzyScore } from '../../utils/fuzzy-match';

export interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  sublabel?: string;
}

export interface CommandGroup {
  label: string;
  items: CommandItem[];
}

interface FlatItem extends CommandItem {
  groupLabel: string;
}

@Component({
  selector: 'app-command-palette',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
    '(document:keydown.arrowdown)': 'onArrowDown($event)',
    '(document:keydown.arrowup)': 'onArrowUp($event)',
    '(document:keydown.enter)': 'onEnter($event)',
  },
})
export class CommandPaletteComponent {
  isOpen = input(false);
  groups = input<CommandGroup[]>([]);
  recentItems = input<CommandItem[]>([]);

  closed = output<void>();
  selected = output<string>();

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly query = signal('');
  readonly activeIndex = signal(0);

  private previouslyFocusedElement: HTMLElement | null = null;

  readonly filteredGroups = computed(() => {
    const q = this.query().trim();
    if (!q) {
      const recents = this.recentItems();
      if (!recents.length) return this.groups();
      return [{ label: 'Recent', items: recents }, ...this.groups()];
    }

    return this.groups()
      .map((g) => {
        const scored = g.items
          .map((item) => ({ item, score: fuzzyScore(item.label, q) }))
          .filter((entry): entry is { item: CommandItem; score: number } => entry.score !== null)
          .sort((a, b) => b.score - a.score);
        return { label: g.label, items: scored.map((entry) => entry.item) };
      })
      .filter((g) => g.items.length > 0);
  });

  /** Flattened list matching render order, used for keyboard navigation. */
  readonly flatItems = computed<FlatItem[]>(() =>
    this.filteredGroups().flatMap((g) => g.items.map((item) => ({ ...item, groupLabel: g.label }))),
  );

  constructor() {
    effect(() => {
      // Reset selection whenever the visible result set changes.
      this.flatItems();
      this.activeIndex.set(0);
    });

    effect(() => {
      if (this.isOpen()) {
        this.previouslyFocusedElement = document.activeElement as HTMLElement | null;
        this.query.set('');
        this.activeIndex.set(0);
        queueMicrotask(() => this.searchInput()?.nativeElement.focus());
      } else if (this.previouslyFocusedElement) {
        this.previouslyFocusedElement.focus();
        this.previouslyFocusedElement = null;
      }
    });

    effect(() => {
      const index = this.activeIndex();
      if (!this.isOpen()) return;
      queueMicrotask(() => {
        document.getElementById(`cmdk-option-${index}`)?.scrollIntoView({ block: 'nearest' });
      });
    });
  }

  isActive(index: number): boolean {
    return this.activeIndex() === index;
  }

  indexOf(item: CommandItem): number {
    return this.flatItems().findIndex((i) => i.id === item.id);
  }

  onEscape() {
    if (this.isOpen()) this.closed.emit();
  }

  onArrowDown(e: Event) {
    if (!this.isOpen()) return;
    e.preventDefault();
    const count = this.flatItems().length;
    if (!count) return;
    this.activeIndex.update((i) => (i + 1) % count);
  }

  onArrowUp(e: Event) {
    if (!this.isOpen()) return;
    e.preventDefault();
    const count = this.flatItems().length;
    if (!count) return;
    this.activeIndex.update((i) => (i - 1 + count) % count);
  }

  onEnter(e: Event) {
    if (!this.isOpen()) return;
    const items = this.flatItems();
    const active = items[this.activeIndex()];
    if (!active) return;
    e.preventDefault();
    this.choose(active.id);
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

  onTrapKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const panel = (e.currentTarget as HTMLElement);
    const focusable = panel.querySelectorAll<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
