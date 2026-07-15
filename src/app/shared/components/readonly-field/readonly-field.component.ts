import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { HiIconComponent, IconData } from '../hi-icon/hi-icon.component';
import { CheckIcon } from '@hugeicons/core-free-icons';

/**
 * Greyed-out label/value display for a field that's already been collected or verified earlier
 * in a flow (e.g. a returning borrower's phone number, or an identity field satisfied by an
 * earlier verification step) — generalizes the borrower portal's existing verified-row markup
 * into a reusable component instead of repeating it ad hoc per screen.
 */
@Component({
  selector: 'app-readonly-field',
  standalone: true,
  imports: [HiIconComponent],
  templateUrl: './readonly-field.component.html',
  styleUrls: ['./readonly-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadonlyFieldComponent {
  label = input<string>('');
  value = input<string>('');
  verified = input<boolean>(true);

  readonly checkIcon: IconData = CheckIcon as IconData;
}
