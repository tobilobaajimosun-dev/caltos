import { Component, Input, OnChanges, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type IconData = readonly (readonly [string, Record<string, unknown>])[];

@Component({
  selector: 'hi-icon',
  standalone: true,
  template: `<svg
    [attr.width]="size"
    [attr.height]="size"
    viewBox="0 0 24 24"
    fill="none"
    [attr.color]="color"
    [innerHTML]="svgInner"
    style="display:inline-block;vertical-align:middle;flex-shrink:0"></svg>`,
})
export class HiIconComponent implements OnChanges {
  @Input() icon: IconData = [];
  @Input() size: number | string = 24;
  @Input() color = 'currentColor';

  svgInner: SafeHtml = '';

  private sanitizer = inject(DomSanitizer);

  ngOnChanges() {
    const html = (this.icon ?? [])
      .map(([tag, attrs]) => {
        const attrStr = Object.entries(attrs)
          .filter(([k]) => k !== 'key')
          .map(([k, v]) => `${toKebab(k)}="${v}"`)
          .join(' ');
        return `<${tag} ${attrStr}/>`;
      })
      .join('');
    this.svgInner = this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

function toKebab(s: string): string {
  return s.replace(/([A-Z])/g, m => '-' + m.toLowerCase());
}
