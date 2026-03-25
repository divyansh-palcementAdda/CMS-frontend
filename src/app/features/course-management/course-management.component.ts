import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseService } from '../../core/services/course.service';
import { CourseItem, CoursePageData } from '../../core/models/course.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent],
  templateUrl: './course-management.component.html',
  styleUrls: ['./course-management.component.scss']
})
export class CourseManagementComponent implements OnInit, OnDestroy {
  pageData: CoursePageData | null = null;
  loading = true;
  searchTerm = '';
  
  currentPage = 1;
  pageSize = 10;
  
  private destroy$ = new Subject<void>();

  constructor(private courseService: CourseService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.courseService.getCoursesData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pageData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading course data', err);
          this.loading = false;
        }
      });
  }

  get filteredCourses(): CourseItem[] {
    if (!this.pageData) return [];
    let list = this.pageData.courses;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.courseType.toLowerCase().includes(term)
      );
    }
    return list;
  }

  get paginatedCourses(): CourseItem[] {
    const list = this.filteredCourses;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCourses.length / this.pageSize) || 1;
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
