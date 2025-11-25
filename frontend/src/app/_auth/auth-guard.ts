import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../_services/auth/auth.service';
import { map, tap } from 'rxjs/operators';

export const AuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated().pipe(
    tap(isAuth => {
      if (!isAuth) {
        // Se non è autenticato, reindirizza al login
        router.navigate(['/login']);
      }
    }),
    map(isAuth => {
      if (!isAuth) return false;

      // Se la rotta richiede ruoli specifici, controllali qui
      const requiredRoles = route.data?.['roles'] as string[];
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRole = requiredRoles.some(role => authService.hasRole(role));
        if (!hasRole) {
          router.navigate(['/unauthorized']);
          return false;
        }
      }
      return true;
    })
  );
};