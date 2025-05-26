// app.routes.ts

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat-room/chat-room.component').then(m => m.ChatComponent),
    canActivate: [() => import('./guards/auth.guard').then(m => m.AuthGuard)]  // use standalone guard
  },
  {
    path: '',
    redirectTo: 'chat',
    pathMatch: 'full'
  }
];
