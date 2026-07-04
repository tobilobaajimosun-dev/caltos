import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface CalendarEvent {
  date: string; // ISO yyyy-mm-dd
  label?: string;
}

interface CalendarCell {
  day: number | null;
  iso: string | null;
  isToday: boolean;
  event?: CalendarEvent;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

@Component({
  selector: 'app-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent {
  month = input(new Date().getMonth() + 1);
  year = input(new Date().getFullYear());
  events = input<CalendarEvent[]>([]);
  selectedDate = input<string | null>(null);

  dateSelected = output<string>();
  monthChange = output<{ month: number; year: number }>();

  readonly weekdays = WEEKDAYS;

  readonly monthLabel = computed(() => `${MONTH_NAMES[this.month() - 1]} ${this.year()}`);

  readonly cells = computed<CalendarCell[]>(() => {
    const m = this.month();
    const y = this.year();
    const eventsByDate = new Map(this.events().map((e) => [e.date, e]));
    const firstDay = new Date(y, m - 1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const todayIso = new Date().toISOString().slice(0, 10);

    const cells: CalendarCell[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, iso: null, isToday: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, iso, isToday: iso === todayIso, event: eventsByDate.get(iso) });
    }
    return cells;
  });

  prevMonth() {
    const m = this.month() - 1;
    this.monthChange.emit(m < 1 ? { month: 12, year: this.year() - 1 } : { month: m, year: this.year() });
  }

  nextMonth() {
    const m = this.month() + 1;
    this.monthChange.emit(m > 12 ? { month: 1, year: this.year() + 1 } : { month: m, year: this.year() });
  }
}
