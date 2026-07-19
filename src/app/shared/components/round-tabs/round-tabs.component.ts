import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild, NgZone, inject, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  label: string;
  value: string;
}

@Component({
  selector: 'app-round-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './round-tabs.component.html',
  styleUrl: './round-tabs.component.scss',
})
export class RoundTabsComponent implements AfterViewInit, OnDestroy {
  @Input() tabs: Tab[] = [];
  @Input() activeTab = '';
  @Output() activeTabChange = new EventEmitter<string>();

  @ViewChild('strip') strip?: ElementRef<HTMLElement>;

  /** True only when the pills actually overshoot the container — drives the edge fade. */
  isOverflowing = false;

  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit() {
    const el = this.strip?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.checkOverflow());
      this.resizeObserver.observe(el);
    });
    this.checkOverflow();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private checkOverflow() {
    const el = this.strip?.nativeElement;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth + 1;
    if (overflowing !== this.isOverflowing) {
      this.zone.run(() => {
        this.isOverflowing = overflowing;
        this.cdr.markForCheck();
      });
    }
  }

  select(value: string) {
    this.activeTabChange.emit(value);
  }
}
