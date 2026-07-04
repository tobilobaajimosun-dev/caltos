import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  isOpen = input(false);
  title = input('Are you sure?');
  message = input('');
  confirmLabel = input('Confirm');
  cancelLabel = input('Cancel');
  danger = input(false);

  confirmed = output<void>();
  cancelled = output<void>();
}
