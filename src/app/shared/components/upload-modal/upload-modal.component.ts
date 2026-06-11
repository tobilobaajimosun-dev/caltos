import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { FileUploadComponent } from '../file-upload/file-upload.component';

export interface RepaymentUpload {
  amount: string;
  channel: string;
  date: string;
  file: File | null;
}

@Component({
  selector: 'app-upload-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, FileUploadComponent],
  templateUrl: './upload-modal.component.html',
  styleUrl: './upload-modal.component.scss',
})
export class UploadModalComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<RepaymentUpload>();

  amount = '';
  channel = '';
  date = '';
  file: File | null = null;

  get isValid(): boolean {
    return !!(this.amount && this.channel && this.date);
  }

  onSubmit() {
    if (this.isValid) {
      this.submitted.emit({ amount: this.amount, channel: this.channel, date: this.date, file: this.file });
    }
  }

  onClose() {
    this.amount = '';
    this.channel = '';
    this.date = '';
    this.file = null;
    this.closed.emit();
  }
}
