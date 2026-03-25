import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseTypeService } from '../../core/services/course-type.service';
import { CourseTypeItem, CourseTypePageData } from '../../core/models/course-type.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-course-type-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent],
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

  constructor(private courseTypeService: CourseTypeService) {}

  ngOnInit() {
    this.loadData();
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
