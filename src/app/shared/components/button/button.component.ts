import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import type { IconSvgObject } from '@hugeicons/angular';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  UserCircleIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'back' | 'filter' | 'round' | 'dropdown' | 'text';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass, HugeiconsIconComponent],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() label = '';
  @Input() disabled = false;
  @Input() active = false;
  @Input() dark = false;
  @Output() clicked = new EventEmitter<void>();

  readonly backIcon: IconSvgObject = ChevronLeftIcon;
  readonly filterIcon: IconSvgObject = FilterIcon;
  readonly userIcon: IconSvgObject = UserCircleIcon;
  readonly refreshIcon: IconSvgObject = RefreshIcon;
  readonly chevronRightIcon: IconSvgObject = ChevronRightIcon;
}
