import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-column-title',
  standalone: true,
  templateUrl: './column-title.component.html',
  styleUrls: ['./column-title.component.scss']
})
export class ColumnTitleComponent {
  @Input() label = 'Name';
  @Input() sortable = false;
  @Input() sorted: 'asc' | 'desc' | null = null;
  @Output() sortChange = new EventEmitter<'asc' | 'desc' | null>();

  cycleSort() {
    if (!this.sortable) return;
    if (this.sorted === null) this.sorted = 'asc';
    else if (this.sorted === 'asc') this.sorted = 'desc';
    else this.sorted = null;
    this.sortChange.emit(this.sorted);
  }
}
