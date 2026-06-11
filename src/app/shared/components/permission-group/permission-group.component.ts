import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PermissionChipComponent } from '../permission-chip/permission-chip.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';

export interface PermissionItem {
  id: string;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-permission-group',
  standalone: true,
  imports: [PermissionChipComponent, CheckboxComponent],
  templateUrl: './permission-group.component.html',
  styleUrls: ['./permission-group.component.scss']
})
export class PermissionGroupComponent {
  @Input() groupName = '';
  @Input() permissions: PermissionItem[] = [];
  @Input() showCustomToggle = false;
  @Input() customEnabled = false;
  @Output() permissionsChange = new EventEmitter<PermissionItem[]>();
  @Output() customEnabledChange = new EventEmitter<boolean>();

  expanded = false;

  get allSelected(): boolean {
    return this.permissions.length > 0 && this.permissions.every(p => p.selected);
  }

  toggleAll() {
    const next = !this.allSelected;
    this.permissions = this.permissions.map(p => ({ ...p, selected: next }));
    this.permissionsChange.emit(this.permissions);
  }

  toggleItem(id: string) {
    this.permissions = this.permissions.map(p =>
      p.id === id ? { ...p, selected: !p.selected } : p
    );
    this.permissionsChange.emit(this.permissions);
  }
}
