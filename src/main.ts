import { bootstrapApplication } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { MaterialModule } from './app/material/material.module';
import { jwtInterceptor } from './app/interceptors/jwt.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptors([jwtInterceptor])),  // <-- This is critical
    provideRouter(routes),
    importProvidersFrom(
      MaterialModule,
       FormsModule, 
       ReactiveFormsModule,
       HttpClientModule
      ),   
  ],
}).catch(err => console.error(err));
