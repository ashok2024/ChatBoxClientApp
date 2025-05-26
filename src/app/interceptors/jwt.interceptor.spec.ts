// src/app/interceptors/jwt.interceptor.ts

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../Services/auth.service'; // Make sure this path is correct!
import { Observable } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  const authService = inject(AuthService); // CORRECT: Use inject() for service instance

  // CORRECT: Call the getToken() method
  const token = authService.getToken();

  // If a token exists, clone the request and add the Authorization header
  if (token) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }

  // Otherwise, just pass the original request along
  return next(req);
};