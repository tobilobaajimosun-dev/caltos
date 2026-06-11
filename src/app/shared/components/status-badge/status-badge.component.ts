import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type BadgeStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'overdue' | 'dormant' | 'successful' | 'failed';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() status: BadgeStatus = 'active';
  @Input() label = '';

  get displayLabel(): string {
    return this.label || (this.status.charAt(0).toUpperCase() + this.status.slice(1));
  }
}
