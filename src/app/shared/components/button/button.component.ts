import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
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
  imports: [NgClass, HiIconComponent],
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

  readonly backIcon: IconData = ChevronLeftIcon as IconData;
  readonly filterIcon: IconData = FilterIcon as IconData;
  readonly userIcon: IconData = UserCircleIcon as IconData;
  readonly refreshIcon: IconData = RefreshIcon as IconData;
  readonly chevronRightIcon: IconData = ChevronRightIcon as IconData;
}
