import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  KpiCardComponent,
  ColumnTitleComponent,
  TableItemComponent,
  StatusBadgeComponent,
  BadgeStatus,
  ButtonComponent,
  UploadModalComponent,
  RepaymentUpload,
} from '../../../shared/components';

interface BulkUploadRow {
  filename: string;
  rowCount: number;
  status: BadgeStatus;
  statusLabel: string;
  uploadedDate: string;
  uploadedBy: string;
}

@Component({
  selector: 'app-bulk-uploads',
  imports: [KpiCardComponent, ColumnTitleComponent, TableItemComponent, StatusBadgeComponent, ButtonComponent, UploadModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bulk-uploads.component.html',
  styleUrl: './bulk-uploads.component.scss',
})
export class BulkUploadsComponent {
  readonly uploads = signal<BulkUploadRow[]>([
    { filename: 'ippis-repayments-jun2026.csv', rowCount: 412, status: 'successful', statusLabel: 'Processed', uploadedDate: '2026-07-01', uploadedBy: 'T. Adeyemi' },
    { filename: 'remita-batch-jul-w1.csv', rowCount: 186, status: 'successful', statusLabel: 'Processed', uploadedDate: '2026-07-03', uploadedBy: 'B. Nwachukwu' },
    { filename: 'direct-debit-jul-w1.csv', rowCount: 94, status: 'pending', statusLabel: 'Processing', uploadedDate: '2026-07-05', uploadedBy: 'K. Suleiman' },
    { filename: 'wacs-repayments-jun2026.csv', rowCount: 58, status: 'failed', statusLabel: 'Failed', uploadedDate: '2026-06-28', uploadedBy: 'T. Adeyemi' },
    { filename: 'dedukt-batch-jun-w4.csv', rowCount: 130, status: 'successful', statusLabel: 'Processed', uploadedDate: '2026-06-24', uploadedBy: 'B. Nwachukwu' },
  ]);

  readonly isUploadOpen = signal(false);

  openUpload() {
    this.isUploadOpen.set(true);
  }

  closeUpload() {
    this.isUploadOpen.set(false);
  }

  onSubmitted(upload: RepaymentUpload) {
    const filename = upload.file?.name ?? `manual-upload-${Date.now()}.csv`;
    this.uploads.update((all) => [
      {
        filename,
        rowCount: 1,
        status: 'pending',
        statusLabel: 'Processing',
        uploadedDate: upload.date || new Date().toISOString().slice(0, 10),
        uploadedBy: 'You',
      },
      ...all,
    ]);
    this.isUploadOpen.set(false);
  }

  readonly totalUploads = computed(() => this.uploads().length);
  readonly rowsProcessed = computed(() =>
    this.uploads().filter((u) => u.status === 'successful').reduce((sum, u) => sum + u.rowCount, 0),
  );
  readonly failedUploads = computed(() => this.uploads().filter((u) => u.status === 'failed').length);
}
