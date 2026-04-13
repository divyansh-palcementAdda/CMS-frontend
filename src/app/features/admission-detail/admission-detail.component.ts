import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AdmissionService } from '../../core/services/admission.service';
import { AdmissionItem } from '../../core/models/admission.model';
import { FeePaymentModalComponent } from '../admission-management/components/fee-payment-modal/fee-payment-modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../core/services/notification.service';
import { AdmissionFormModalComponent } from '../admission-management/components/admission-form-modal/admission-form-modal.component';

// Notification service imported via core services

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, FeePaymentModalComponent, AdmissionFormModalComponent],
  templateUrl: './admission-detail.component.html',
  styleUrls: ['./admission-detail.component.scss']
})
export class AdmissionDetailComponent implements OnInit, OnDestroy {
  admissionId!: number;
  loading = true;
  detail: AdmissionItem | null = null;
  private destroy$ = new Subject<void>();
  showFeeModal = false;
  isSyncMode = false;
  showAdmissionModal = false;
  selectedStudentId: number | null = null;

  // Actions

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private admissionService: AdmissionService,
    private notificationService: NotificationService
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

  onEdit(id: number) {
    this.selectedStudentId = id;
    this.showAdmissionModal = true;
  }

  closeAdmissionModal() {
    this.showAdmissionModal = false;
    this.selectedStudentId = null;
  }

  onAdmissionSaved() {
    this.closeAdmissionModal();
    this.loadData();
  }

  async onDelete() {
    if (!this.detail) return;
    
    const confirmed = await this.notificationService.confirm(
      'Confirm Deletion',
      'Are you sure you want to delete this admission? This action cannot be undone.',
      'Delete',
      'Cancel'
    );

    if (confirmed) {
      this.loading = true;
      this.admissionService.deleteAdmission(this.admissionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success('Deleted', 'Admission has been deleted successfully.');
            this.router.navigate(['/admission-management']);
          },
          error: (err) => {
            console.error('Error deleting admission', err);
            this.notificationService.error('Delete Failed', 'An error occurred while deleting the admission.');
            this.loading = false;
          }
        });
    }
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
        this.router.navigate(['/courses', id]);
        break;
      case 'institution':
        this.router.navigate(['/institutions', id]);
        break;
      case 'user':
        this.router.navigate(['/users', id]);
        break;
      case 'consultancy':
        this.router.navigate(['/consultancy', id]);
        break;
    }
  }

  async toggleFeeStatus(currentStatus: boolean) {
    if (!this.detail) return;

    // If marking as UNPAID (current is Paid)
    if (currentStatus) {
      const confirmed = await this.notificationService.confirm(
        'Confirm Unpaid Status',
        'Are you sure you want to mark this student as Unpaid? This will also reset any calculated commission.',
        'Mark Unpaid',
        'Cancel'
      );
      if (confirmed) {
        this.updateFeeStatusServiceCall(false);
      }
      return;
    }

    // If marking as PAID (current is Unpaid)
    // We open the modal first to record payment and check threshold
    this.isSyncMode = true;
    this.showFeeModal = true;
  }

  openAddFees() {
    this.isSyncMode = false;
    this.showFeeModal = true;
  }

  onFeeSaved(isThresholdMet: boolean) {
    this.showFeeModal = false;
    
    // Auto-update status ONLY if triggered by the toggle sync AND threshold met
    if (this.isSyncMode && isThresholdMet) {
      this.updateFeeStatusServiceCall(true);
    } else {
      // Just reload data to show the new fee history entry (or if they saved anyway)
      this.loadData();
    }
  }

  private updateFeeStatusServiceCall(newStatus: boolean) {
    if (!this.detail) return;
    this.loading = true;
    this.admissionService.updateFeeStatus(this.detail.id!, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Status Updated', `Student marked as ${newStatus ? 'Paid' : 'Unpaid'} successfully.`);
        },
        error: (err) => {
          console.error('Error updating fee status', err);
          this.notificationService.error('Update Failed', err.error?.message || 'Could not update fee status');
          this.loading = false;
        }
      });
  }

  updateCommissionStatus(newStatus: string) {
    if (!this.detail) return;

    const currentStatus = this.detail.commissionStatus;

    // Redundant update check
    if (currentStatus === newStatus) return;

    // Rule 1: Cannot mark PENDING manually from any state
    if (newStatus === 'PENDING') {
      this.notificationService.warning('Manual Action Restricted', 'Commission status can only be reset to "Pending" automatically by the system (e.g., when fees are unpaid).');
      this.loadData();
      return;
    }

    // Rule 2: Cannot transition FROM Pending manually
    if (currentStatus === 'PENDING') {
      this.notificationService.warning('Manual Action Restricted', 'Status can only move from "Pending" to "Calculated" automatically once 50% fees are paid.');
      this.loadData();
      return;
    }

    // Rule 3: Valid manual transitions (CALCULATED <-> PAID)
    if (currentStatus === 'CALCULATED' && newStatus !== 'PAID') {
       this.notificationService.warning('Invalid Action', 'From "Calculated" status, you can only mark the commission as "Paid".');
       this.loadData();
       return;
    }

    if (currentStatus === 'PAID' && newStatus !== 'CALCULATED') {
       this.notificationService.warning('Invalid Action', 'From "Paid" status, you can only move back to "Calculated".');
       this.loadData();
       return;
    }

    this.loading = true;
    this.admissionService.updateCommissionStatus(this.detail.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Commission status updated successfully.');
          this.loadData();
        },
        error: (err: any) => {
          const errorMsg = err?.error?.message || 'Error updating commission status';
          this.notificationService.error('Update Failed', errorMsg);
          this.loadData(); // Reset to server state
        }
      });
  }

  get calculatedDiscountAmount(): number {
    if (!this.detail) return 0;
    if (this.detail.discountType === 'PERCENTAGE') {
      return ((this.detail.totalCourseFees || 0) * (this.detail.discountValue || 0)) / 100;
    }
    return this.detail.discountValue || 0;
  }

  scrollToHistory() {
    const element = document.getElementById('feeHistorySection');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
