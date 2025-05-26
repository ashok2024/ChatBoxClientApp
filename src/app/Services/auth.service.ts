import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

interface LoginResponse {
  token: string;
  username: string;
  displayName: string;
  imageUrl?: string;
}

interface DecodedToken {
  nameid: string; // Corresponds to ClaimTypes.NameIdentifier (email)
  unique_name: string; // Corresponds to ClaimTypes.Name (displayName)
  exp: number;
  iat: number;
  nbf: number;
  aud: string;
  iss: string;
}
export interface RegisterRequest {
  name: string; // Corresponds to DisplayName
  email: string;
  password: string;
  mobileNumber: string; // Assuming you collect this
  role: string; // Assuming you collect this
}
export interface RegisterResponse {
  message: string;
  email: string;
  displayName: string;
}
export interface Group {
  id: number;
  groupName: string;
  membersEmails: string[];
  createdAt: string;  // Use string for DateTime (ISO string format)
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5191/api'; // Backend API URL
  private tokenKey = 'jwtToken';
  private currentUserEmailSource = new BehaviorSubject<string | null>(null);
  private currentUserDisplayNameSource = new BehaviorSubject<string | null>(null);
  currentUserEmail$ = this.currentUserEmailSource.asObservable();
  currentUserDisplayName$ = this.currentUserDisplayNameSource.asObservable();
  private loginSuccess = new Subject<void>();
  loginSuccess$ = this.loginSuccess.asObservable();
  constructor(private http: HttpClient, private router: Router) {
    this.loadCurrentUserFromLocalStorage();
  }

  private loadCurrentUserFromLocalStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      const decoded: DecodedToken = jwtDecode(token);
      this.currentUserEmailSource.next(decoded.nameid);
      this.currentUserDisplayNameSource.next(decoded.unique_name);
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/Account/login`, { email, password }).pipe(

      tap(response => {
        debugger;
        localStorage.setItem(this.tokenKey, response.token);
        this.currentUserEmailSource.next(response.username);
        localStorage.setItem("currentUserEmail", response.username);
        localStorage.setItem("currentDisplayName", response.displayName);
        if (response.imageUrl) {
          localStorage.setItem("profileImageUrl", response.imageUrl);
        }
        this.currentUserDisplayNameSource.next(response.displayName);
        this.loginSuccess.next();
        this.router.navigate(['/chat']);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserEmailSource.next(null);
    this.currentUserDisplayNameSource.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    try {
      const decoded: DecodedToken = jwtDecode(token);
      const isTokenExpired = decoded.exp * 1000 < Date.now();
      return !isTokenExpired;
    } catch (error) {
      return false; // Token is invalid or malformed
    }
  }

  getCurrentUserEmail(): string | null {
    //return this.currentUserEmailSource.value;
    console.log(localStorage.getItem("currentUserEmail"));
    return localStorage.getItem("currentUserEmail");
  }
  registerWithImage(formData: FormData) {
    return this.http.post<any>(`${this.apiUrl}/Account/register`, formData);
  }
  getCurrentUserDisplayName(): string | null {
    return localStorage.getItem("currentDisplayName");
  }
  register(name: string, email: string, password: string, mobileNumber: string, role: string): Observable<RegisterResponse> {
    const requestBody: RegisterRequest = { name, email, password, mobileNumber, role };
    return this.http.post<RegisterResponse>(`${this.apiUrl}/Account/register`, requestBody);
  }
  getCurrentUserProfile(): string | null {
    return localStorage.getItem("profileImageUrl");
  }
  
}