import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CalendarComponent } from '../calendar/calendar.component';

export interface DateRange {
  preset: string;
  start: string | null;
  end: string | null;
}

const PRESETS = ['Today', 'Yesterday', 'This Week', 'This Month', 'Custom'];

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.scss',
})
export class DateRangePickerComponent {
  rangeChange = output<DateRange>();

  readonly presets = PRESETS;
  readonly activePreset = signal('Today');
  readonly rangeStart = signal<string | null>(null);
  readonly rangeEnd = signal<string | null>(null);
  readonly calMonth = signal(new Date().getMonth() + 1);
  readonly calYear = signal(new Date().getFullYear());

  selectPreset(preset: string) {
    this.activePreset.set(preset);
    if (preset !== 'Custom') {
      this.rangeStart.set(null);
      this.rangeEnd.set(null);
      this.rangeChange.emit({ preset, start: null, end: null });
    }
  }

  onDateSelected(iso: string) {
    this.activePreset.set('Custom');
    if (!this.rangeStart() || (this.rangeStart() && this.rangeEnd())) {
      this.rangeStart.set(iso);
      this.rangeEnd.set(null);
    } else if (iso < this.rangeStart()!) {
      this.rangeEnd.set(this.rangeStart());
      this.rangeStart.set(iso);
    } else {
      this.rangeEnd.set(iso);
    }
    this.rangeChange.emit({ preset: 'Custom', start: this.rangeStart(), end: this.rangeEnd() });
  }

  onMonthChange(e: { month: number; year: number }) {
    this.calMonth.set(e.month);
    this.calYear.set(e.year);
  }
}
