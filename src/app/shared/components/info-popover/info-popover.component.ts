import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionPositionPair, OverlayModule } from '@angular/cdk/overlay';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';

export type InfoPopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

const RIGHT: ConnectionPositionPair = {
  originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center',
  offsetX: 8, panelClass: 'popover-arrow-left',
};
const LEFT: ConnectionPositionPair = {
  originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center',
  offsetX: -8, panelClass: 'popover-arrow-right',
};
const BOTTOM: ConnectionPositionPair = {
  originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top',
  offsetY: 8, panelClass: 'popover-arrow-top',
};
const TOP: ConnectionPositionPair = {
  originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom',
  offsetY: -8, panelClass: 'popover-arrow-bottom',
};

const PLACEMENT_POSITIONS: Record<InfoPopoverPlacement, ConnectionPositionPair[]> = {
  right: [RIGHT, LEFT, BOTTOM, TOP],
  left: [LEFT, RIGHT, BOTTOM, TOP],
  top: [TOP, BOTTOM, RIGHT, LEFT],
  bottom: [BOTTOM, TOP, RIGHT, LEFT],
};

/**
 * Reusable contextual-help affordance: an (i) icon that opens a small popover
 * with a title/description. Rendered via CDK Overlay so it's never clipped by
 * a card's `overflow: hidden` and always sits above page content.
 */
@Component({
  selector: 'app-info-popover',
  standalone: true,
  imports: [CommonModule, OverlayModule, HiIconComponent],
  templateUrl: './info-popover.component.html',
  styleUrl: './info-popover.component.scss',
  host: {
    '(document:keydown.escape)': 'onDocumentEscape()',
  },
})
export class InfoPopoverComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() placement: InfoPopoverPlacement = 'right';
  @Input() maxWidth = 280;

  protected readonly infoIcon: IconData = InformationCircleIcon as unknown as IconData;

  protected isOpen = signal(false);
  private closeTimeout?: ReturnType<typeof setTimeout>;

  protected get positions(): ConnectionPositionPair[] {
    return PLACEMENT_POSITIONS[this.placement];
  }

  protected onTriggerClick(event: MouseEvent) {
    event.stopPropagation();
    clearTimeout(this.closeTimeout);
    this.isOpen.set(true);
  }

  protected onMouseEnter() {
    clearTimeout(this.closeTimeout);
    this.isOpen.set(true);
  }

  protected onMouseLeave() {
    clearTimeout(this.closeTimeout);
    this.closeTimeout = setTimeout(() => this.isOpen.set(false), 120);
  }

  protected close() {
    clearTimeout(this.closeTimeout);
    this.isOpen.set(false);
  }

  protected onDocumentEscape() {
    if (this.isOpen()) this.close();
  }
}
