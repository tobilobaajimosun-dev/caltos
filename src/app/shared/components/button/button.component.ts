import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterVerticalIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'back' | 'filter' | 'round' | 'dropdown' | 'text';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass, HiIconComponent],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  host: { '[class.full-width-host]': 'fullWidth' }
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() label = '';
  @Input() disabled = false;
  @Input() active = false;
  @Input() dark = false;
  @Input() icon: IconData | null = null;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<void>();

  readonly backIcon: IconData = ChevronLeftIcon as IconData;
  readonly filterIcon: IconData = FilterVerticalIcon as IconData;
  readonly refreshIcon: IconData = RefreshIcon as IconData;
  readonly chevronRightIcon: IconData = ChevronRightIcon as IconData;

  get roundIcon(): IconData {
    return this.icon ?? this.refreshIcon;
  }
}
