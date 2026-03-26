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

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent],
  templateUrl: './admission-detail.component.html',
  styleUrls: ['./admission-detail.component.scss']
})
export class AdmissionDetailComponent implements OnInit, OnDestroy {
  admissionId!: number;
  loading = true;
  detail: AdmissionItem | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private admissionService: AdmissionService
  ) {}

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
    console.log('Edit clicked for admission:', this.admissionId);
    window.location.hash = '';
  }

  onDelete() {
    if (confirm('Are you sure you want to delete this admission record?')) {
      // In a real app, call service.deleteAdmission(id)
      alert('Admission record deleted (Mock)');
      this.router.navigate(['/admission-management']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
