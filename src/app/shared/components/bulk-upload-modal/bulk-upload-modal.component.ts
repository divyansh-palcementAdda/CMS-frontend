import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

export interface BulkUploadResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  successes: any[];
  failures: { rowNumber: number; errorMessage: string }[];
}

@Component({
  selector: 'app-bulk-upload-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-upload-modal.component.html',
  styleUrls: ['./bulk-upload-modal.component.scss']
})
export class BulkUploadModalComponent {
  @Input() title: string = 'Bulk Upload';
  @Input() moduleName: string = 'Records';
  @Input() service: any; // Service must implement bulkUpload and downloadTemplate

  @Output() uploaded = new EventEmitter<BulkUploadResult>();
  @Output() closed = new EventEmitter<void>();

  selectedFile: File | null = null;
  isDragging = false;
  uploadStatus: 'IDLE' | 'UPLOADING' | 'SUCCESS' | 'PARTIAL' | 'ERROR' = 'IDLE';
  uploadResult: BulkUploadResult | null = null;
  errorMessage: string | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadStatus = 'IDLE';
      this.uploadResult = null;
      this.errorMessage = null;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
      this.uploadStatus = 'IDLE';
      this.uploadResult = null;
      this.errorMessage = null;
    }
  }

  downloadTemplate() {
    if (!this.service || !this.service.downloadTemplate) return;
    
    this.service.downloadTemplate().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.moduleName}_Template.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Template download failed', err);
        this.errorMessage = 'Failed to download template. Please try again.';
      }
    });
  }

  uploadFile() {
    if (!this.selectedFile || !this.service || !this.service.bulkUpload) return;

    this.uploadStatus = 'UPLOADING';
    this.errorMessage = null;

    this.service.bulkUpload(this.selectedFile).subscribe({
      next: (result: BulkUploadResult) => {
        this.uploadResult = result;
        if (result.failureCount === 0) {
          this.uploadStatus = 'SUCCESS';
        } else if (result.successCount > 0) {
          this.uploadStatus = 'PARTIAL';
        } else {
          this.uploadStatus = 'ERROR';
        }
        this.uploaded.emit(result);
      },
      error: (err: any) => {
        console.error('Upload failed', err);
        this.uploadStatus = 'ERROR';
        this.errorMessage = err.error?.message || 'An unexpected error occurred during upload.';
      }
    });
  }

  close() {
    this.closed.emit();
  }

  reset() {
    this.selectedFile = null;
    this.uploadStatus = 'IDLE';
    this.uploadResult = null;
    this.errorMessage = null;
  }
}
