import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  tabs = input<TabItem[]>([]);
  activeTab = input('');
  activeTabChange = output<string>();
}
