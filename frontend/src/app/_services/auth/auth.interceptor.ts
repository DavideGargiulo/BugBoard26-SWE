import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('localhost:3000')) {
    const cloned = req.clone({
      withCredentials: true
    });
    return next(cloned);
  }

  return next(req);
};