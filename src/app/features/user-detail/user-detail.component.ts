import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { UserService } from '../../core/services/user.service';
import { UserItem } from '../../core/models/user.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConsultancyService } from '../../core/services/consultancy.service';

import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent, ConfirmationModalComponent],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit, OnDestroy {
  userId!: number;
  loading = true;
  user: UserItem | null = null;
  private destroy$ = new Subject<void>();

  // Actions
  showDeleteModal = false;
  itemToDelete: any = null;
  deleteType: 'user' | 'consultancy' = 'user';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private consultancyService: ConsultancyService
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading = true;
    this.userService.getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.user = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading user details', err);
          this.loading = false;
        }
      });
  }

  onEdit() {
    this.router.navigate([], { fragment: 'edit' });
  }

  onDelete() {
    this.itemToDelete = this.user;
    this.deleteType = 'user';
    this.showDeleteModal = true;
  }

  onViewConsultancy(id: number) {
    this.router.navigate(['/consultancy-management', id]);
  }

  onEditConsultancy(id: number) {
    this.router.navigate(['/consultancy-management'], { fragment: 'edit' });
  }

  onDeleteConsultancy(consultancy: any) {
    this.itemToDelete = consultancy;
    this.deleteType = 'consultancy';
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.itemToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;
    this.loading = true;
    let deleteObservable;

    if (this.deleteType === 'user') {
      deleteObservable = this.userService.deleteUser(this.userId);
    } else if (this.deleteType === 'consultancy') {
      deleteObservable = this.consultancyService.deleteConsultancy(this.itemToDelete.id);
    } else {
      this.loading = false;
      this.showDeleteModal = false;
      return;
    }

    deleteObservable.subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.itemToDelete = null;
        if (this.deleteType === 'user') {
          this.router.navigate(['/users']);
        } else {
          this.loadData();
        }
      },
      error: (err) => {
        console.error(`Error deleting ${this.deleteType}`, err);
        this.loading = false;
        this.showDeleteModal = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
