import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-badge-card',
  standalone: true,
  templateUrl: './badge-card.component.html',
  styleUrls: ['./badge-card.component.scss']
})
export class BadgeCardComponent {
  @Input() title = 'Have feedback?';
  @Input() description = 'Read our docs to resolve any bug or issues encountered.';
  @Output() actioned = new EventEmitter<void>();
}
