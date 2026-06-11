import { Component, Input, Output, EventEmitter } from '@angular/core';

export type NavItemIcon =
  | 'dashboard' | 'home' | 'customers' | 'wallet' | 'products'
  | 'loans' | 'reports' | 'risk' | 'teams' | 'settings' | 'quick-action' | 'none';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  templateUrl: './nav-item.component.html',
  styleUrls: ['./nav-item.component.scss']
})
export class NavItemComponent {
  @Input() label = '';
  @Input() icon: NavItemIcon = 'none';
  @Input() active = false;
  @Input() hasDropdown = false;
  @Input() expanded = false;
  @Input() variant: 'default' | 'primary-text' = 'default';
  @Output() clicked = new EventEmitter<void>();
  @Output() expandedChange = new EventEmitter<boolean>();

  onClick() {
    if (this.hasDropdown) {
      this.expanded = !this.expanded;
      this.expandedChange.emit(this.expanded);
    }
    this.clicked.emit();
  }
}
