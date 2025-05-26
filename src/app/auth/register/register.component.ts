// src/app/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../Services/auth.service'; // Adjust path if needed
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'], // Assuming you have a CSS file
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule, // For routerLink
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule
  ]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  selectedImage: File | null = null;


  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]], // Added minLength
      mobileNumber: ['', [Validators.pattern('^[0-9]{10}$'), Validators.required]], // Simple 10-digit pattern
      role: ['User', Validators.required] // Default role or user selection
    });
  }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
    }
  }
  register(): void {
    if (this.registerForm.valid) {
      const { name, email, password, mobileNumber, role } = this.registerForm.value;

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('mobileNumber', mobileNumber);
      formData.append('role', role);

      if (this.selectedImage) {
        formData.append('image', this.selectedImage);
      }
      this.authService.registerWithImage(formData).subscribe({
        next: (response) => {
          this.snackBar.open(response.message, 'Close', { duration: 3000 });
          this.router.navigate(['/login']); // Redirect to login after successful registration
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.error || 'Registration failed.';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          console.error('Registration error:', err);
        }
      });
    } else {
      this.snackBar.open('Please fill all required fields with valid data.', 'Close', { duration: 3000 });
      this.registerForm.markAllAsTouched();
    }
  }
}