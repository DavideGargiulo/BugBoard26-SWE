import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';

export const routes: Routes = [
  {
    path: "login",
    component: LoginComponent,
    title: "Login - BugBoard"
  },

  // Redirect alla login se l'utente va sulla root
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: '/login'
  }

];