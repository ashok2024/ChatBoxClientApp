import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../Services/auth.service';
import { inject } from '@angular/core';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
  var token = authService.getToken();

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};