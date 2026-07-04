import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { AuthLayoutComponent } from '../../../shared/components';

type Step = 'email' | 'check-email' | 'new-password' | 'success';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);

  readonly step = signal<Step>('email');
  readonly submitting = signal(false);
  readonly resendCooldown = signal(0);
  readonly showPassword = signal(false);

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly password = signal('');

  readonly strength = computed(() => {
    const p = this.password();
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (!p) return { level: 0, label: '' as const };
    if (score <= 1) return { level: 1, label: 'weak' as const };
    if (score <= 2) return { level: 2, label: 'fair' as const };
    return { level: 3, label: 'strong' as const };
  });

  readonly passwordsMismatch = computed(() => {
    const { password, confirmPassword } = this.passwordForm.getRawValue();
    return !!confirmPassword && password !== confirmPassword;
  });

  onPasswordInput(value: string) {
    this.password.set(value);
  }

  submitEmail() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.step.set('check-email');
      this.startCooldown();
    }, 500);
  }

  resend() {
    if (this.resendCooldown() > 0) return;
    this.startCooldown();
  }

  private startCooldown() {
    this.resendCooldown.set(30);
    const timer = setInterval(() => {
      this.resendCooldown.update((v) => {
        if (v <= 1) clearInterval(timer);
        return Math.max(0, v - 1);
      });
    }, 1000);
  }

  // Demo-only: simulates clicking the reset link from the email
  openResetLink() {
    this.step.set('new-password');
  }

  submitNewPassword() {
    if (this.passwordForm.invalid || this.passwordsMismatch()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.step.set('success');
    }, 500);
  }
}
