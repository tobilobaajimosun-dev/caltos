import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

export interface WizardStep {
  id: string;
  label: string;
}

export type WizardStepStatus = 'done' | 'active' | 'upcoming';

@Component({
  selector: 'app-wizard-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wizard-stepper.component.html',
  styleUrl: './wizard-stepper.component.scss',
})
export class WizardStepperComponent {
  steps = input.required<WizardStep[]>();
  currentIndex = input(0);
  stepClick = output<number>();

  status(i: number): WizardStepStatus {
    const cur = this.currentIndex();
    if (i === cur) return 'active';
    return i < cur ? 'done' : 'upcoming';
  }

  readonly fillPercent = computed(() => {
    const total = this.steps().length - 1;
    if (total <= 0) return 0;
    return (this.currentIndex() / total) * 100;
  });

  onClick(i: number) {
    if (this.status(i) === 'upcoming') return;
    this.stepClick.emit(i);
  }
}
