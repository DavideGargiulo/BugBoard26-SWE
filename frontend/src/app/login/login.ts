// import { Component } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { AuthService } from '../_services/auth/auth.service';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './login.html'
// })
// export class LoginComponent {
//   loginForm: FormGroup;
//   errorMessage: string = '';
//   isLoading: boolean = false;

//   // Variabile per gestire la visibilità della password
//   showPassword: boolean = false;

//   constructor(
//     private fb: FormBuilder,
//     private authService: AuthService,
//     private router: Router
//   ) {
//     this.loginForm = this.fb.group({
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', Validators.required],
//       rememberMe: [false] // Aggiunto per risolvere l'errore "Cannot find control with name: 'rememberMe'"
//     });
//   }

//   // Metodo chiamato dal pulsante occhio nel template
//   togglePasswordVisibility(): void {
//     this.showPassword = !this.showPassword;
//   }

//   onSubmit(): void {
//     if (this.loginForm.valid) {
//       this.isLoading = true;
//       this.errorMessage = '';

//       // Estraiamo i valori dal form
//       const { email, password, rememberMe } = this.loginForm.value;

//       this.authService.login(email, password, rememberMe).subscribe({
//         next: () => {
//           this.isLoading = false;
//           this.router.navigate(['/dashboard']);
//         },
//         error: (err) => {
//           this.isLoading = false;
//           console.error('Login error', err);
//           this.errorMessage = 'Credenziali non valide.';
//         }
//       });
//     }
//   }
// }

// login-card.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styles: []
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    console.log('Login attempt:', {
      email: this.email,
      password: this.password,
      rememberMe: this.rememberMe
    });
    // Implementa qui la logica di login
  }
}