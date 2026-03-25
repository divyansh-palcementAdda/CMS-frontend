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
    path: 'course-types',
    loadComponent: () => import('./features/course-type-management/course-type-management.component').then(m => m.CourseTypeManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'consultancy',
    loadComponent: () => import('./features/consultancy-management/consultancy-management.component').then(m => m.ConsultancyManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  { path: '**', redirectTo: '/admin/dashboard' }
];
