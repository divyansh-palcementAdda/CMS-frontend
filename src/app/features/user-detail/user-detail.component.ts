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

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TopbarComponent],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit, OnDestroy {
  userId!: number;
  loading = true;
  user: UserItem | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
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
    console.log('Edit clicked for user:', this.userId);
    window.location.hash = '';
  }

  onDelete() {
    if (confirm('Are you sure you want to delete this user?')) {
      alert('User marked inactive (Mock)');
      this.router.navigate(['/users']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
