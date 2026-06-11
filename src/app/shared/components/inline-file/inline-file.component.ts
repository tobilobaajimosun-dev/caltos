import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FileType = 'mp4' | 'pdf' | 'png' | 'jpeg';

@Component({
  selector: 'app-inline-file',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inline-file.component.html',
  styleUrl: './inline-file.component.scss',
})
export class InlineFileComponent {
  @Input() fileName = '';
  @Input() fileType: FileType = 'pdf';
  @Input() uploadDate = '';
  @Output() viewed = new EventEmitter<void>();
}
