import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';

export type IconButtonIcon = 'edit' | 'check' | 'close' | 'delete' | 'more' | 'edit-open' | 'info' | 'view' | 'expand';
export type IconButtonColor = 'default' | 'blue' | 'green' | 'red';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [NgClass],
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.scss']
})
export class IconButtonComponent {
  @Input() icon: IconButtonIcon = 'edit';
  @Input() label = '';
  @Input() color: IconButtonColor = 'default';
  @Input() filled = false;
  @Output() clicked = new EventEmitter<void>();
}
