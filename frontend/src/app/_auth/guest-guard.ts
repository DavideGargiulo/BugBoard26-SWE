import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../_services/auth/auth.service';
import { map } from 'rxjs/operators';

export const GuestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated().pipe(
    map(isAuth => {
      if (isAuth) {
        // Se l'utente è già autenticato, non deve vedere il login -> vai alla dashboard
        router.navigate(['/dashboard']);
        return false;
      }
      // Se NON è autenticato, può procedere al login
      return true;
    })
  );
};