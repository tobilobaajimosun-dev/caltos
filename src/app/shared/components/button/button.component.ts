import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'back' | 'filter' | 'round' | 'dropdown' | 'text';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass],
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
}
