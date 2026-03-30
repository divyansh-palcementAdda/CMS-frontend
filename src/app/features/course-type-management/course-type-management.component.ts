import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseTypeService } from '../../core/services/course-type.service';
import { CourseTypeItem, CourseTypePageData } from '../../core/models/course-type.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-course-type-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent],
  templateUrl: './course-type-management.component.html',
  styleUrls: ['./course-type-management.component.scss']
})
export class CourseTypeManagementComponent implements OnInit, OnDestroy {
  pageData: CourseTypePageData | null = null;
  loading = true;
  searchTerm = '';
  
  currentPage = 1;
  pageSize = 10;
  
  private destroy$ = new Subject<void>();

  // Actions
  showDeleteModal = false;
  selectedCourseType: CourseTypeItem | null = null;

  constructor(
    private courseTypeService: CourseTypeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  onView(id: number) {
    this.router.navigate(['/course-types', id]);
  }

  onEdit(id: number) {
    this.router.navigate([], { fragment: 'edit' });
  }

  onDelete(courseType: CourseTypeItem) {
    this.selectedCourseType = courseType;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.selectedCourseType = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (this.selectedCourseType) {
      this.loading = true;
      this.courseTypeService.deleteCourseType(this.selectedCourseType.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.selectedCourseType = null;
            this.showDeleteModal = false;
            this.loadData();
          },
          error: (err: any) => {
            console.error('Error deleting course type', err);
            this.loading = false;
            this.showDeleteModal = false;
          }
        });
    }
  }

  loadData() {
    this.loading = true;
    this.courseTypeService.getCourseTypesData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pageData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading course type data', err);
          this.loading = false;
        }
      });
  }

  get filteredCourseTypes(): CourseTypeItem[] {
    if (!this.pageData) return [];
    let list = this.pageData.courseTypes;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term)
      );
    }
    return list;
  }

  get paginatedCourseTypes(): CourseTypeItem[] {
    const list = this.filteredCourseTypes;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCourseTypes.length / this.pageSize) || 1;
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
