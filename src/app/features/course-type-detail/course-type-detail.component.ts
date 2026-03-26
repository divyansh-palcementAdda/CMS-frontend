import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { CourseTypeService } from '../../core/services/course-type.service';
import { CourseService } from '../../core/services/course.service';
import { CourseTypeItem } from '../../core/models/course-type.model';
import { CoursePageData, CourseItem } from '../../core/models/course.model';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-course-type-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent],
  templateUrl: './course-type-detail.component.html',
  styleUrls: ['./course-type-detail.component.scss']
})
export class CourseTypeDetailComponent implements OnInit, OnDestroy {
  typeId!: number;
  loading = true;
  typeDetail: CourseTypeItem | null = null;
  coursesPageData: CoursePageData | null = null;
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseTypeService: CourseTypeService,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.typeId = +idParam;
        this.loadData();
      }
    });
  }

  onEdit() {
    console.log(`Edit button clicked for ID: ${this.typeId}`);
    window.location.hash = '';
  }

  onDelete() {
    if (window.confirm('Are you sure you want to delete this course type?')) {
      this.loading = true;
      this.courseTypeService.deleteCourseType(this.typeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert('Course type deleted successfully');
            this.router.navigate(['/course-types']);
          },
          error: (err: any) => {
            console.error('Error deleting course type', err);
            alert('Failed to delete course type');
            this.loading = false;
          }
        });
    }
  }

  loadData() {
    this.loading = true;
    forkJoin({
      type: this.courseTypeService.getCourseTypeById(this.typeId),
      courses: this.courseService.getCoursesByType(this.typeId)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.typeDetail = res.type;
        this.coursesPageData = res.courses;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading course type details', err);
        this.loading = false;
      }
    });
  }

  get filteredCourses(): CourseItem[] {
    if (!this.coursesPageData) return [];
    let list = this.coursesPageData.courses;
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
