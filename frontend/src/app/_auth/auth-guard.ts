import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from '../_services/auth/auth.service'; // Assicurati che il percorso sia giusto
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

export const AuthGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated().pipe(
    take(1),
    map(isAuth => {
      if (isAuth) {
        return true;
      } else {
        return router.createUrlTree(['/login']);
      }
    })
  );
};