import {
  Component, ElementRef, EventEmitter, Input, Output,
  TemplateRef, ContentChild, OnChanges, OnDestroy, SimpleChanges,
  ViewContainerRef, inject,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

/**
 * Wraps a trigger button + a `<ng-template>` menu body and renders the menu through
 * Angular CDK Overlay instead of an absolutely-positioned sibling `<div>`.
 *
 * Why: the old pattern (`position: absolute` inside a table row/card) gets clipped the
 * moment any ancestor sets `overflow: hidden` — which every table wrapper and card does
 * for scroll/rounded-corner reasons. CDK Overlay attaches to the global overlay container
 * appended at the end of `<body>`, so the menu floats above everything regardless of what
 * overflow rules its trigger's ancestors have, and FlexibleConnectedPositionStrategy
 * automatically flips between below/above/left/right based on available viewport space.
 *
 * Usage:
 * ```html
 * <app-row-menu #rowMenu [open]="openId === row.id" (openChange)="openId = $event ? row.id : null">
 *   <button trigger #trigger class="more-btn" (click)="rowMenu.toggle($event)">...</button>
 *   <ng-template>
 *     <div class="row-dropdown">...menu items...</div>
 *   </ng-template>
 * </app-row-menu>
 * ```
 * The host page keeps its own menu-item markup/styles — only the positioning mechanism
 * changes to CDK Overlay + TemplatePortal (the projected `<ng-template>` is compiled as
 * part of the host page's component, so its existing view-encapsulated SCSS still applies
 * even though the overlay renders it outside that component's DOM subtree).
 */
@Component({
  selector: 'app-row-menu',
  standalone: true,
  template: `<ng-content select="[trigger]" />`,
  styles: [`:host { display: contents; }`],
})
export class RowMenuComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  @ContentChild('trigger', { read: ElementRef, static: true }) triggerRef!: ElementRef<HTMLElement>;
  @ContentChild(TemplateRef) menuTemplate!: TemplateRef<unknown>;

  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  private static readonly POSITIONS: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 },
    { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
    { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
  ];

  ngOnChanges(changes: SimpleChanges) {
    if ('open' in changes) {
      if (this.open) this.show();
      else this.hide();
    }
  }

  toggle(event: Event) {
    event.stopPropagation();
    this.openChange.emit(!this.open);
  }

  private show() {
    if (this.overlayRef) return;

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.triggerRef)
      .withPositions(RowMenuComponent.POSITIONS)
      .withPush(true)
      .withViewportMargin(8);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    this.overlayRef.backdropClick().subscribe(() => this.openChange.emit(false));
    this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') this.openChange.emit(false);
    });

    this.overlayRef.attach(new TemplatePortal(this.menuTemplate, this.viewContainerRef));
  }

  private hide() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  ngOnDestroy() {
    this.hide();
  }
}
