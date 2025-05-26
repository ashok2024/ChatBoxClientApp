import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../Services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',  
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, RouterModule],
})
export class LoginComponent {

 loginForm!: FormGroup;
  constructor(private authService: AuthService, private snackBar: MatSnackBar , private fb: FormBuilder ) { }
   ngOnInit(): void { // <-- Initialize the form in ngOnInit
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Define email control with validators
      password: ['', Validators.required] // Define password control with validators
    });
  }

 
 login(): void {
    // debugger; // You can keep this for debugging if you like

    // CRUCIAL CHANGE: Access values from loginForm
    if (this.loginForm.valid) { // Check if the form is valid based on validators
      const { email, password } = this.loginForm.value; // Get the values from the form

      this.authService.login(email, password).subscribe({
        next: (response) => {
          // Handled by authService to navigate
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open('Login failed: ' + (err.error?.message || err.message), 'Close', { duration: 5000 });
          console.error('Login error:', err);
        }
      });
    } else {
      this.snackBar.open('Please enter valid email and password.', 'Close', { duration: 3000 });
      // Optional: Mark all fields as touched to display validation messages
      this.loginForm.markAllAsTouched();
    }
  }
}
