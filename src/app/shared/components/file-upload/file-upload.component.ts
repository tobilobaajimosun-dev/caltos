import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  @Input() label = '';
  @Input() accept = '.jpeg,.jpg,.png,.pdf';
  @Output() fileSelected = new EventEmitter<File | null>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  isDragOver = false;

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
    this.fileSelected.emit(file);
  }
}
