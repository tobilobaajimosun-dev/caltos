import { Component } from '@angular/core';
import {
  KpiCardComponent,
  PaginationComponent,
  RoundTabsComponent,
  FileUploadComponent,
  InlineFileComponent,
  ModalComponent,
  UploadModalComponent,
  Tab,
} from './shared/components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    KpiCardComponent,
    PaginationComponent,
    RoundTabsComponent,
    FileUploadComponent,
    InlineFileComponent,
    ModalComponent,
    UploadModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  currentPage = 1;
  pageSize = 100;

  tabs: Tab[] = [
    { label: 'All Payouts', value: 'all' },
    { label: 'Successful', value: 'successful' },
    { label: 'Failed', value: 'failed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Reversed', value: 'reversed' },
  ];
  activeTab = 'all';

  showModal = false;
  showUploadModal = false;
}
