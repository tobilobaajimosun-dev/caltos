import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
  @Input() type: 'success' | 'error' = 'success';
  @Input() title = 'Note added successfully!';
  @Input() message = 'Note has been added to customer profile successfully.';
  @Output() dismissed = new EventEmitter<void>();
}
