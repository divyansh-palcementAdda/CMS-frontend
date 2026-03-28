import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'admin/admission-management',
    loadComponent: () => import('./features/admission-management/admission-management.component').then(m => m.AdmissionManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'users',
    loadComponent: () => import('./features/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'institutions',
    loadComponent: () => import('./features/institution-management/institution-management.component').then(m => m.InstitutionManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'institutions/:id',
    loadComponent: () => import('./features/institution-detail/institution-detail.component').then(m => m.InstitutionDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'roles',
    loadComponent: () => import('./features/role-management/role-management.component').then(m => m.RoleManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'courses',
    loadComponent: () => import('./features/course-management/course-management.component').then(m => m.CourseManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'courses/:id',
    loadComponent: () => import('./features/course-detail/course-detail.component').then(m => m.CourseDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'course-types',
    loadComponent: () => import('./features/course-type-management/course-type-management.component').then(m => m.CourseTypeManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'course-types/:id',
    loadComponent: () => import('./features/course-type-detail/course-type-detail.component').then(m => m.CourseTypeDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'consultancy',
    loadComponent: () => import('./features/consultancy-management/consultancy-management.component').then(m => m.ConsultancyManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'consultancy/:id',
    loadComponent: () => import('./features/consultancy-detail/consultancy-detail.component').then(m => m.ConsultancyDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'admissions/:id',
    loadComponent: () => import('./features/admission-detail/admission-detail.component').then(m => m.AdmissionDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./features/user-detail/user-detail.component').then(m => m.UserDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  { path: '**', redirectTo: '/admin/dashboard' }
];
