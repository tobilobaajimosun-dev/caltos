import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import type { IconSvgObject } from '@hugeicons/angular';
import {
  PencilIcon,
  CheckIcon,
  MultiplicationSignIcon,
  DeleteThrowIcon,
  MoreHorizontalIcon,
  InformationCircleIcon,
  EyeIcon,
  ArrowExpandIcon,
} from '@hugeicons/core-free-icons';

export type IconButtonIcon = 'edit' | 'check' | 'close' | 'delete' | 'more' | 'edit-open' | 'info' | 'view' | 'expand';
export type IconButtonColor = 'default' | 'blue' | 'green' | 'red';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [NgClass, HugeiconsIconComponent],
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.scss']
})
export class IconButtonComponent {
  @Input() icon: IconButtonIcon = 'edit';
  @Input() label = '';
  @Input() color: IconButtonColor = 'default';
  @Input() filled = false;
  @Output() clicked = new EventEmitter<void>();

  readonly iconMap: Record<string, IconSvgObject> = {
    edit: PencilIcon,
    'edit-open': PencilIcon,
    check: CheckIcon,
    close: MultiplicationSignIcon,
    delete: DeleteThrowIcon,
    more: MoreHorizontalIcon,
    info: InformationCircleIcon,
    view: EyeIcon,
    expand: ArrowExpandIcon,
  };
}
