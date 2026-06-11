import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-permission-chip',
  standalone: true,
  templateUrl: './permission-chip.component.html',
  styleUrls: ['./permission-chip.component.scss']
})
export class PermissionChipComponent {
  @Input() label = '';
  @Input() active = false;
  @Input() removable = false;
  @Output() removed = new EventEmitter<void>();
  @Output() clicked = new EventEmitter<void>();
}
