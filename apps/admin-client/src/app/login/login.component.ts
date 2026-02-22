import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  onSubmit() {
    if (this.loginForm.valid) {
      this.http.post('/api/auth/login', this.loginForm.value).pipe(
        tap((response: any) => {
          // Assuming the server returns a token and user info
          // You would typically save the token to local storage
          localStorage.setItem('token', response.token);
          this.router.navigate(['/']);
        })
      ).subscribe();
    }
  }
}
