import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BulkMapResponseDTO {
    mappedCount: number;
    failedCount: number;
    unmatchedUsers: string[];
    unmatchedConsultancies: string[];
    errorFileId: string;
}

@Component({
  selector: 'app-bulk-map-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-map-modal.component.html',
  styleUrls: ['../bulk-upload-modal/bulk-upload-modal.component.scss']
})
export class BulkMapModalComponent {
  @Input() service: any; // ConsultancyService

  @Output() mapped = new EventEmitter<BulkMapResponseDTO>();
  @Output() closed = new EventEmitter<void>();

  selectedFile: File | null = null;
  isDragging = false;
  uploadStatus: 'IDLE' | 'UPLOADING' | 'SUCCESS' | 'PARTIAL' | 'ERROR' = 'IDLE';
  uploadResult: BulkMapResponseDTO | null = null;
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
    if (!this.service || !this.service.downloadBulkMapTemplate) return;
    
    this.service.downloadBulkMapTemplate().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bulk_Mapping_Template.xlsx`;
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

  downloadErrorFile() {
    if (!this.service || !this.service.downloadBulkMapErrorFile || !this.uploadResult?.errorFileId) return;
    
    this.service.downloadBulkMapErrorFile(this.uploadResult.errorFileId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bulk_Mapping_Errors.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Error file download failed', err);
        this.errorMessage = 'Failed to download error file. Please try again.';
      }
    });
  }

  uploadFile() {
    if (!this.selectedFile || !this.service || !this.service.bulkMapUpload) return;

    this.uploadStatus = 'UPLOADING';
    this.errorMessage = null;

    this.service.bulkMapUpload(this.selectedFile).subscribe({
      next: (result: BulkMapResponseDTO) => {
        this.uploadResult = result;
        if (result.failedCount === 0) {
          this.uploadStatus = 'SUCCESS';
        } else if (result.mappedCount > 0) {
          this.uploadStatus = 'PARTIAL';
        } else {
          this.uploadStatus = 'ERROR';
        }
        this.mapped.emit(result);
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
