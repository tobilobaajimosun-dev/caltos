import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  label: string;
  value: string;
}

@Component({
  selector: 'app-round-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './round-tabs.component.html',
  styleUrl: './round-tabs.component.scss',
})
export class RoundTabsComponent {
  @Input() tabs: Tab[] = [];
  @Input() activeTab = '';
  @Output() activeTabChange = new EventEmitter<string>();

  select(value: string) {
    this.activeTabChange.emit(value);
  }
}
