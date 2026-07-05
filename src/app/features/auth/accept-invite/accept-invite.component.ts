import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthLayoutComponent, ButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [ReactiveFormsModule, AuthLayoutComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accept-invite.component.html',
  styleUrl: './accept-invite.component.scss',
})
export class AcceptInviteComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly token = this.route.snapshot.paramMap.get('token') ?? '';
  readonly orgName = 'Princeps Finance';
  readonly inviterName = 'Jesulademi Ajimosun';
  readonly inviteeEmail = 'new.teammate@princepsfinance.com';

  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly password = signal('');

  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  readonly passwordsMismatch = computed(() => {
    const { password, confirmPassword } = this.form.getRawValue();
    return !!confirmPassword && password !== confirmPassword;
  });

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

  onPasswordInput(value: string) {
    this.password.set(value);
  }

  acceptInvite() {
    if (this.form.invalid || this.passwordsMismatch()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.router.navigateByUrl('/home');
    }, 500);
  }
}
