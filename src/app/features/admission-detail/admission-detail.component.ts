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
    this.router.navigate(['/admission-management'], { fragment: 'edit', queryParams: { id: this.admissionId } });
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
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/admission-management']);
    }
  }

  viewDetails(type: 'course' | 'institution' | 'user' | 'consultancy', id?: number) {
    if (!id) return;
    switch (type) {
      case 'course':
        this.router.navigate(['/course-management', id]);
        break;
      case 'institution':
        this.router.navigate(['/institution-management', id]);
        break;
      case 'user':
        this.router.navigate(['/user-management', id]);
        break;
      case 'consultancy':
        this.router.navigate(['/consultancy-management', id]);
        break;
    }
  }

  toggleFeeStatus(currentStatus: boolean) {
    if (!this.detail) return;
    const newStatus = !currentStatus;

    this.loading = true;
    this.admissionService.updateFeeStatus(this.detail.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadData();
        },
        error: (err) => {
          console.error('Error updating fee status', err);
          this.loading = false;
        }
      });
  }

  updateCommissionStatus(newStatus: string) {
    if (!this.detail) return;

    // Validation Logic
    if (this.detail.commissionStatus === 'PENDING') {
      alert('Please mark this student as partial fees paid before updating commission status.');
      return;
    }

    if (this.detail.commissionStatus === 'PAID' && newStatus === 'PAID') return;
    
    // Allow transition but enforce rules
    if (newStatus === 'PAID' && this.detail.commissionStatus !== 'CALCULATED') {
       alert('Commission can only be marked as Paid if it is in Calculated status.');
       return;
    }

    this.loading = true;
    this.admissionService.updateCommissionStatus(this.detail.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadData();
        },
        error: (err: any) => {
          const errorMsg = err?.error?.message || 'Error updating commission status';
          alert(errorMsg);
          this.loading = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
