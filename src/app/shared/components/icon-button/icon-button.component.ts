import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
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
  imports: [NgClass, HiIconComponent],
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.scss']
})
export class IconButtonComponent {
  @Input() icon: IconButtonIcon = 'edit';
  @Input() label = '';
  @Input() color: IconButtonColor = 'default';
  @Input() filled = false;
  @Output() clicked = new EventEmitter<void>();

  readonly iconMap: Record<string, IconData> = {
    edit: PencilIcon as IconData,
    'edit-open': PencilIcon as IconData,
    check: CheckIcon as IconData,
    close: MultiplicationSignIcon as IconData,
    delete: DeleteThrowIcon as IconData,
    more: MoreHorizontalIcon as IconData,
    info: InformationCircleIcon as IconData,
    view: EyeIcon as IconData,
    expand: ArrowExpandIcon as IconData,
  };
}
