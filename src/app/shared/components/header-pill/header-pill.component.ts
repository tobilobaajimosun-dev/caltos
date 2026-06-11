import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header-pill',
  standalone: true,
  templateUrl: './header-pill.component.html',
  styleUrls: ['./header-pill.component.scss']
})
export class HeaderPillComponent {
  @Input() label = '';
  @Input() active = false;
  @Output() clicked = new EventEmitter<void>();
}
