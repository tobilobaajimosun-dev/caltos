import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 6;
  @Input() pageSize = 100;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  readonly pageSizes = [10, 25, 50, 100];

  get pages(): (number | '...')[] {
    if (this.totalPages <= 6) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
    return [1, 2, 3, 4, '...', this.totalPages];
  }

  prevPageSize() {
    const idx = this.pageSizes.indexOf(this.pageSize);
    if (idx > 0) this.pageSizeChange.emit(this.pageSizes[idx - 1]);
  }

  nextPageSize() {
    const idx = this.pageSizes.indexOf(this.pageSize);
    if (idx < this.pageSizes.length - 1) this.pageSizeChange.emit(this.pageSizes[idx + 1]);
  }

  goTo(page: number | '...') {
    if (typeof page === 'number' && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
