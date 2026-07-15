import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
import { SearchComponent } from '../search/search.component';
import { ChevronDownIcon, CheckIcon } from '@hugeicons/core-free-icons';
import { NIGERIAN_BANKS, NigerianBank } from '../../data/nigerian-banks';

/**
 * Searchable bank dropdown for the borrower portal's income-verification screens (Remita/WACS
 * account lookup) — a borrower must find their exact bank name before entering an account number,
 * so a plain text field risks a mistyped/ambiguous bank name reaching the (mocked) lookup.
 * Composed from the existing app-select trigger/menu markup (for visual consistency) and
 * app-search (for the filter input), rather than introducing a new dropdown pattern.
 */
@Component({
  selector: 'app-bank-select',
  standalone: true,
  imports: [HiIconComponent, SearchComponent],
  templateUrl: './bank-select.component.html',
  styleUrls: ['./bank-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankSelectComponent {
  value = input<string>('');
  disabled = input<boolean>(false);
  placeholder = input<string>('Search for your bank');
  valueChange = output<string>();

  readonly chevronIcon: IconData = ChevronDownIcon as IconData;
  readonly checkIcon: IconData = CheckIcon as IconData;

  readonly open = signal(false);
  readonly query = signal('');
  readonly banks: NigerianBank[] = NIGERIAN_BANKS;

  readonly filteredBanks = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.banks;
    return this.banks.filter((b) => b.name.toLowerCase().includes(q));
  });

  toggle() {
    if (this.disabled()) return;
    this.query.set('');
    this.open.update((v) => !v);
  }

  select(bank: NigerianBank) {
    this.valueChange.emit(bank.name);
    this.open.set(false);
  }

  close() {
    this.open.set(false);
  }
}
