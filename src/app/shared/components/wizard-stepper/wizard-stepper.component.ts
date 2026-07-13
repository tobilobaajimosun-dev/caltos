import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

export interface WizardStep {
  id: string;
  label: string;
  /** Rendered in the rail instead of `label` when set — keeps each row to one line in the fixed-width rail. */
  shortLabel?: string;
  /** Optional sub-items shown only while this step is active (see reference design). */
  substeps?: string[];
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
  /** Index of the active substep within the active step's `substeps`, if any. */
  activeSubstepIndex = input<number | null>(null);
  stepClick = output<number>();
  substepClick = output<{ stepIndex: number; substepIndex: number }>();

  status(i: number): WizardStepStatus {
    const cur = this.currentIndex();
    if (i === cur) return 'active';
    return i < cur ? 'done' : 'upcoming';
  }

  onClick(i: number) {
    if (this.status(i) === 'upcoming') return;
    this.stepClick.emit(i);
  }

  onSubstepClick(stepIndex: number, substepIndex: number) {
    this.substepClick.emit({ stepIndex, substepIndex });
  }
}
