import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  @Input() placeholder = 'Search members';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();

  focused = false;

  onInput(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
    this.valueChange.emit(this.value);
  }

  clear() {
    this.value = '';
    this.valueChange.emit('');
    this.cleared.emit();
  }
}
