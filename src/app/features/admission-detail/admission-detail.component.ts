import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdmissionService } from '../../core/services/admission.service';
import { AdmissionItem } from '../../core/models/admission.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent],
  templateUrl: './admission-detail.component.html',
  styleUrls: ['./admission-detail.component.scss']
})
export class AdmissionDetailComponent implements OnInit, OnDestroy {
  admissionId!: number;
  loading = true;
  detail: AdmissionItem | null = null;
  private destroy$ = new Subject<void>();

  // Actions
  showDeleteModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private admissionService: AdmissionService
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.admissionId = +idParam;
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading = true;
    this.admissionService.getAdmissionById(this.admissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.detail = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading admission details', err);
          this.loading = false;
        }
      });
  }

  onEdit() {
    this.router.navigate([], { fragment: 'edit' });
  }

  onDelete() {
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
  }

  confirmDelete() {
    this.loading = true;
    this.admissionService.deleteAdmission(this.admissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showDeleteModal = false;
          this.router.navigate(['/admission-management']);
        },
        error: (err) => {
          console.error('Error deleting admission', err);
          this.loading = false;
          this.showDeleteModal = false;
        }
      });
  }

  goBack() {
    this.router.navigate(['/admission-management']);
  }

  toggleFeeStatus(status: 'Paid' | 'Unpaid') {
    if (!this.detail) return;
    const isPaid = status === 'Paid';

    this.loading = true;
    this.admissionService.updateFeeStatus(this.detail.id, isPaid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.detail) {
            this.detail.feeStatus = status;
            this.detail.fiftyPercentFeesPaid = isPaid;
            this.detail.feeStatus = isPaid ? 'Paid' : 'Unpaid';
          }
          this.loading = false;
          this.loadData();
        },
        error: (err) => {
          console.error('Error updating fee status', err);
          this.loading = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
