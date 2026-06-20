import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-org-profile',
  standalone: true,
  templateUrl: './org-profile.component.html',
  styleUrls: ['./org-profile.component.scss']
})
export class OrgProfileComponent {
  @Input() orgName = 'Princeps Finance';
  @Input() avatarLetter = 'P';
  @Input() avatarColor = '#E55A2B';
  @Input() role = 'ADMIN';
  @Input() iconOnly = false;
  @Output() clicked = new EventEmitter<void>();
}
