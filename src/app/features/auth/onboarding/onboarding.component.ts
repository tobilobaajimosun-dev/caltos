import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent, ToastComponent } from '../../../shared/components';

type Step = 'create-account' | 'verify-otp' | 'success';

interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One number', test: (v) => /\d/.test(v) },
  { label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly step = signal<Step>('create-account');
  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly passwordFocused = signal(false);
  readonly password = signal('');
  readonly toastVisible = signal(false);

  readonly createAccountForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    businessEmail: ['', [Validators.required, Validators.email]],
    orgName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    agreeTerms: [false, Validators.requiredTrue],
  });

  readonly otpForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  readonly formError = signal('');

  readonly passwordsMismatch = computed(() => {
    const { password, confirmPassword } = this.createAccountForm.getRawValue();
    return !!confirmPassword && password !== confirmPassword;
  });

  readonly passwordRuleChecks = computed(() => {
    const p = this.password();
    return PASSWORD_RULES.map((rule) => ({ label: rule.label, passed: rule.test(p) }));
  });

  readonly allPasswordRulesPassed = computed(() => this.passwordRuleChecks().every((r) => r.passed));

  onPasswordInput(value: string) {
    this.password.set(value);
  }

  submitCreateAccount() {
    this.formError.set('');
    if (this.createAccountForm.invalid || this.passwordsMismatch() || !this.allPasswordRulesPassed()) {
      this.createAccountForm.markAllAsTouched();
      if (this.passwordsMismatch()) this.formError.set('Passwords do not match.');
      else if (!this.allPasswordRulesPassed()) this.formError.set('Password does not meet all requirements.');
      return;
    }
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.step.set('verify-otp');
      this.showToast();
    }, 500);
  }

  private showToast() {
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 4000);
  }

  resendOtp() {
    this.showToast();
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
        this.formError.set('Invalid code. Please check your email and try again.');
        return;
      }
      this.step.set('success');
    }, 500);
  }

  backToCreateAccount() {
    this.step.set('create-account');
    this.formError.set('');
  }

  goToDashboard() {
    this.router.navigateByUrl('/quick-actions');
  }
}
