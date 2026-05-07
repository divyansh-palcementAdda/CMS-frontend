import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadSourceService } from '../../../../core/services/lead-source.service';
import { LeadSourceDTO } from '../../../../core/models/lead-source.model';

@Component({
  selector: 'app-ls-add-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-lead-source-modal.component.html',
  styleUrls: ['./add-lead-source-modal.component.scss']
})
export class AddLeadSourceModalComponent implements OnInit {
  @Input() id: string | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private leadSourceService = inject(LeadSourceService);

  loading = false;
  error = '';
  leadSource: LeadSourceDTO = {
    name: '',
    active: true,
    deleted: false
  };

  ngOnInit() {
    if (this.id) {
      this.loadLeadSource();
    }
  }

  loadLeadSource() {
    this.loading = true;
    this.leadSourceService.getById(this.id!).subscribe({
      next: (res) => {
        this.leadSource = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load lead source details';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    this.loading = true;
    this.error = '';

    const obs = this.id 
      ? this.leadSourceService.update(this.id, this.leadSource)
      : this.leadSourceService.create(this.leadSource);

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.success.emit();
        this.closed.emit();
      },
      error: (err) => {
        this.error = err.error?.message || 'Something went wrong';
        this.loading = false;
      }
    });
  }
}

