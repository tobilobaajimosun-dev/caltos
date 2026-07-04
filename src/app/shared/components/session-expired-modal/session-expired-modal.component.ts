import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-session-expired-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-expired-modal.component.html',
  styleUrl: './session-expired-modal.component.scss',
})
export class SessionExpiredModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly session = inject(SessionService);

  readonly submitting = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    password: ['', Validators.required],
  });

  resume() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.form.reset();
      this.session.resume();
    }, 400);
  }

  signOut() {
    this.session.resume();
    this.router.navigateByUrl('/login');
  }
}
