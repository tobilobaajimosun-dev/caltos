import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components';

type Step = 'org-basics' | 'admin-account' | 'org-verification' | 'platform-setup' | 'invite-team' | 'success';

const STEPS: { id: Step; label: string }[] = [
  { id: 'org-basics', label: 'Organization' },
  { id: 'admin-account', label: 'Admin Account' },
  { id: 'org-verification', label: 'Verification' },
  { id: 'platform-setup', label: 'Platform Setup' },
  { id: 'invite-team', label: 'Invite Team' },
];

interface InviteRow {
  email: string;
  role: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly steps = STEPS;
  readonly step = signal<Step>('org-basics');
  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly verificationMethod = signal<'cac' | 'rc'>('cac');
  readonly password = signal('');

  readonly stepIndex = computed(() => this.steps.findIndex((s) => s.id === this.step()));

  readonly industries = ['Microfinance', 'SACCO', 'Corporate Lender', 'Individual'];
  readonly licenseTypes = ['Moneylender', 'Microfinance Bank', 'Digital Lending License', 'Other'];
  readonly states = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara',
  ];
  readonly roles = ['Admin', 'Loan Officer', 'Risk Manager', 'Support'];

  readonly orgForm = this.fb.nonNullable.group({
    orgName: ['', [Validators.required, Validators.maxLength(75)]],
    industry: ['', Validators.required],
    country: ['Nigeria', Validators.required],
    state: ['', Validators.required],
    website: [''],
    description: [''],
  });

  readonly adminForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    phone: ['', Validators.required],
  });

  readonly verificationForm = this.fb.nonNullable.group({
    hasLicense: ['', Validators.required],
    workingOnLicense: [''],
    licenseType: [''],
    rcNumber: [''],
    bvn: ['', [Validators.pattern(/^\d{11}$/)]],
  });

  readonly invites = signal<InviteRow[]>([{ email: '', role: 'Loan Officer' }]);

  readonly passwordsMismatch = computed(() => {
    const { password, confirmPassword } = this.adminForm.getRawValue();
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

  goToStep(id: Step) {
    this.step.set(id);
  }

  next() {
    const idx = this.stepIndex();
    if (idx < this.steps.length - 1) {
      this.step.set(this.steps[idx + 1].id);
    } else {
      this.step.set('success');
    }
  }

  back() {
    const idx = this.stepIndex();
    if (idx > 0) this.step.set(this.steps[idx - 1].id);
  }

  submitOrgBasics() {
    if (this.orgForm.invalid) {
      this.orgForm.markAllAsTouched();
      return;
    }
    this.next();
  }

  submitAdminAccount() {
    if (this.adminForm.invalid || this.passwordsMismatch()) {
      this.adminForm.markAllAsTouched();
      return;
    }
    this.next();
  }

  continueVerification() {
    this.next();
  }

  goToProductSetup() {
    this.router.navigateByUrl('/products/create');
  }

  addInviteRow() {
    this.invites.update((rows) => [...rows, { email: '', role: 'Loan Officer' }]);
  }

  removeInviteRow(index: number) {
    this.invites.update((rows) => rows.filter((_, i) => i !== index));
  }

  updateInviteEmail(index: number, email: string) {
    this.invites.update((rows) => rows.map((r, i) => (i === index ? { ...r, email } : r)));
  }

  updateInviteRole(index: number, role: string) {
    this.invites.update((rows) => rows.map((r, i) => (i === index ? { ...r, role } : r)));
  }

  sendInvites() {
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.step.set('success');
    }, 500);
  }

  goToDashboard() {
    this.router.navigateByUrl('/quick-actions');
  }
}
