import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../../shared/components';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly step = signal<'credentials' | 'otp'>('credentials');
  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly formError = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly otpForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  field(name: 'email' | 'password') {
    return this.form.controls[name];
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  submitCredentials() {
    this.formError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      if (this.form.controls.email.value === 'locked@princepsfinance.com') {
        this.formError.set('Incorrect email or password. Please try again.');
        return;
      }
      this.step.set('otp');
    }, 500);
  }

  submitOtp() {
    this.formError.set('');
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      if (this.otpForm.controls.otp.value !== '123456') {
        this.formError.set('Invalid code. Please check your authenticator app and try again.');
        return;
      }
      this.router.navigateByUrl('/');
    }, 500);
  }

  backToCredentials() {
    this.step.set('credentials');
    this.formError.set('');
  }
}
