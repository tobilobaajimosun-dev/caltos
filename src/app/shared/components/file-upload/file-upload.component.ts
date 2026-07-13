import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import type { IconSvgObject } from '@hugeicons/angular';
import { CloudUploadIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent implements OnInit, OnDestroy {
  @Input() label = '';
  @Input() accept = '.jpeg,.jpg,.png,.pdf';
  /** A previously-saved image (e.g. a data URL restored from a saved product) to show before any new file is picked in this session. */
  @Input() initialPreviewUrl: string | null | undefined = null;
  @Output() fileSelected = new EventEmitter<File | null>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly uploadIcon = CloudUploadIcon as unknown as IconSvgObject;

  selectedFile: File | null = null;
  isDragOver = false;
  /** Object/data URL for the current thumbnail, so you can see what image was actually uploaded. */
  previewUrl: string | null = null;
  /** True once `previewUrl` came from `initialPreviewUrl` rather than a file picked in this session — there's no File/filename to show for it. */
  isInitialPreview = false;

  ngOnInit() {
    if (this.initialPreviewUrl) {
      this.previewUrl = this.initialPreviewUrl;
      this.isInitialPreview = true;
    }
  }

  onZoneClick() {
    this.fileInput.nativeElement.click();
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.setFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    this.setFile(event.dataTransfer?.files[0] ?? null);
  }

  removeFile() {
    this.fileInput.nativeElement.value = '';
    this.setFile(null);
  }

  private setFile(file: File | null) {
    this.selectedFile = file;
    this.revokePreview();
    this.previewUrl = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    this.isInitialPreview = false;
    this.fileSelected.emit(file);
  }

  private revokePreview() {
    // Only object URLs we created (via createObjectURL) need revoking — the
    // initial preview is a data URL passed in from outside, not ours to revoke.
    if (this.previewUrl && !this.isInitialPreview) URL.revokeObjectURL(this.previewUrl);
  }

  ngOnDestroy() {
    this.revokePreview();
  }
}
