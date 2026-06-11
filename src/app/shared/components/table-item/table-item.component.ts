import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { StatusBadgeComponent, BadgeStatus } from '../status-badge/status-badge.component';

export type TableItemType =
  | 'user-avatar'
  | 'user'
  | 'date'
  | 'status'
  | 'text'
  | 'tags'
  | 'amount'
  | 'actions'
  | 'more';

export interface TableItemUser {
  name: string;
  email: string;
  initials?: string;
  avatarColor?: string;
}

@Component({
  selector: 'app-table-item',
  standalone: true,
  imports: [NgClass, StatusBadgeComponent],
  templateUrl: './table-item.component.html',
  styleUrls: ['./table-item.component.scss']
})
export class TableItemComponent {
  @Input() type: TableItemType = 'text';
  @Input() text = '';
  @Input() user: TableItemUser | null = null;
  @Input() status: BadgeStatus = 'active';
  @Input() tags: string[] = [];
  @Input() amount = '';
  @Input() date = '';
  @Input() linkLabel = '';
}
