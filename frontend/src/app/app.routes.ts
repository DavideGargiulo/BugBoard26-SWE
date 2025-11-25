import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { LoginLayoutComponent } from './layout/login-layout/login-layout';
import { UsersComponent } from './users/users';
import { ProjectComponent } from './project/project';
import { AuthGuard } from './_auth/auth-guard';
import { GuestGuard } from './_auth/guest-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginLayoutComponent,
    canActivate: [GuestGuard],
    children: [
      { path: '', component: LoginComponent }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'utenti', component: UsersComponent },
      { path: 'progetto', component: ProjectComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];