import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

const DONE_KEY = 'caltos-onboarding';
const DISMISSED_KEY = 'caltos-onboarding-dismissed';

export type OnboardingStepIcon = 'product' | 'team' | 'vendor' | 'catalogue' | 'reminder';

export interface OnboardingStep {
  id: string;
  label: string;
  route: string;
  icon: OnboardingStepIcon;
  newTab?: boolean;
}

@Component({
  selector: 'app-onboarding-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './onboarding-widget.component.html',
  styleUrl: './onboarding-widget.component.scss',
})
export class OnboardingWidgetComponent {
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly steps: OnboardingStep[] = [
    { id: 'create-product', label: 'Create your first loan product', route: '/products/create', icon: 'product' },
    { id: 'invite-team', label: 'Invite your team members', route: '/teams', icon: 'team' },
    { id: 'onboard-vendor', label: 'Onboard a BNPL vendor', route: '/utilities/vendors', icon: 'vendor' },
    { id: 'share-catalogue', label: 'Share your product catalogue', route: '/products/catalogue', icon: 'catalogue', newTab: true },
    { id: 'repayment-reminders', label: 'Set up repayment reminders', route: '/repayments', icon: 'reminder' },
  ];

  readonly open = signal(false);
  readonly done = signal<string[]>(this.readDone());
  readonly dismissed = signal<boolean>(this.readDismissed());

  readonly remaining = computed(() => this.steps.filter((s) => !this.done().includes(s.id)).length);
  readonly allDone = computed(() => this.remaining() === 0);
  readonly progressPct = computed(() => (this.done().length / this.steps.length) * 100);

  isDone(id: string): boolean {
    return this.done().includes(id);
  }

  toggle() {
    this.open.update((v) => !v);
  }

  close() {
    this.open.set(false);
  }

  onEscape() {
    if (this.open()) this.close();
  }

  selectStep(step: OnboardingStep) {
    if (!this.isDone(step.id)) {
      this.done.update((ids) => [...ids, step.id]);
      if (this.isBrowser) {
        localStorage.setItem(DONE_KEY, JSON.stringify(this.done()));
      }
    }
    if (step.newTab) {
      if (this.isBrowser) window.open(step.route, '_blank', 'noopener');
    } else {
      this.router.navigateByUrl(step.route);
    }
  }

  dismiss() {
    this.dismissed.set(true);
    this.open.set(false);
    if (this.isBrowser) {
      localStorage.setItem(DISMISSED_KEY, '1');
    }
  }

  private readDone(): string[] {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return [];
    try {
      const raw = localStorage.getItem(DONE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }

  private readDismissed(): boolean {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return false;
    return localStorage.getItem(DISMISSED_KEY) === '1';
  }
}
