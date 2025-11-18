import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';

export const routes: Routes = [
  {
    path: "login",
    component: LoginComponent,
    title: "Login - BugBoard"
  },

  {
    path: "dashboard",
    component: DashboardComponent,
    title: "Dashboard - BugBoard"
  },

  // Redirect alla login se l'utente va sulla root
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

];