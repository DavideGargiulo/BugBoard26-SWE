import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const AuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const isAuth = true;

  if (!isAuth){
    router.navigate(['/login']);
  }

  return isAuth;
};
