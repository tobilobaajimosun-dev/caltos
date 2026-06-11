import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  template: `
    <div class="qr-wrap" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="'0 0 ' + size + ' ' + size">
        <rect width="100%" height="100%" fill="white"/>
        <!-- corner markers -->
        <rect [attr.x]="pad" [attr.y]="pad" [attr.width]="m" [attr.height]="m" rx="3" fill="#121212"/>
        <rect [attr.x]="pad+3" [attr.y]="pad+3" [attr.width]="m-6" [attr.height]="m-6" rx="1" fill="white"/>
        <rect [attr.x]="pad+6" [attr.y]="pad+6" [attr.width]="m-12" [attr.height]="m-12" rx="1" fill="#121212"/>
        <rect [attr.x]="size-pad-m" [attr.y]="pad" [attr.width]="m" [attr.height]="m" rx="3" fill="#121212"/>
        <rect [attr.x]="size-pad-m+3" [attr.y]="pad+3" [attr.width]="m-6" [attr.height]="m-6" rx="1" fill="white"/>
        <rect [attr.x]="size-pad-m+6" [attr.y]="pad+6" [attr.width]="m-12" [attr.height]="m-12" rx="1" fill="#121212"/>
        <rect [attr.x]="pad" [attr.y]="size-pad-m" [attr.width]="m" [attr.height]="m" rx="3" fill="#121212"/>
        <rect [attr.x]="pad+3" [attr.y]="size-pad-m+3" [attr.width]="m-6" [attr.height]="m-6" rx="1" fill="white"/>
        <rect [attr.x]="pad+6" [attr.y]="size-pad-m+6" [attr.width]="m-12" [attr.height]="m-12" rx="1" fill="#121212"/>
        <!-- data modules -->
        @for (dot of dots; track $index) {
          <rect [attr.x]="dot.x" [attr.y]="dot.y" [attr.width]="cell-1" [attr.height]="cell-1" fill="#121212"/>
        }
      </svg>
    </div>
  `,
  styles: [`
    .qr-wrap {
      display: inline-flex; border: 1px solid var(--color-stroke);
      border-radius: 8px; overflow: hidden; padding: 8px; background: #fff;
    }
  `]
})
export class QrCodeComponent implements OnChanges {
  @Input() value = '';
  @Input() size = 160;

  readonly pad = 12;
  readonly m = 36;   // marker size
  readonly cell = 6;

  dots: { x: number; y: number }[] = [];

  ngOnChanges() { this.generate(); }

  private generate() {
    // Deterministic pseudo-random grid based on value string
    const seed = [...(this.value || 'caltos')].reduce((a, c) => a + c.charCodeAt(0), 0);
    const cols = Math.floor((this.size - this.pad * 2) / this.cell);
    const safe = (x: number, y: number) => {
      const inCorner = (cx: number, cy: number) =>
        x >= cx && x < cx + this.m + this.cell && y >= cy && y < cy + this.m + this.cell;
      return !inCorner(this.pad, this.pad) &&
             !inCorner(this.size - this.pad - this.m - this.cell, this.pad) &&
             !inCorner(this.pad, this.size - this.pad - this.m - this.cell);
    };
    this.dots = [];
    let s = seed;
    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        if ((s >>> 0) % 2 === 0) {
          const x = this.pad + c * this.cell;
          const y = this.pad + r * this.cell;
          if (safe(x, y)) this.dots.push({ x, y });
        }
      }
    }
  }
}
