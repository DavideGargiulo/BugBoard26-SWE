import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {

  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Inizializza il form con i validatori
   */
  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  /**
   * Toggle per mostrare/nascondere la password
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Gestisce il submit del form
   */
  onSubmit(): void {
    // Marca tutti i campi come touched per mostrare gli errori
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe
    };

    console.log('Credentials:', credentials);

    // Simulazione chiamata API
    this.performLogin(credentials);
  }

  /**
   * Simula una chiamata al backend per il login
   */
  private performLogin(credentials: any): void {
    // Sostituisci con la tua chiamata HTTP reale
    // Esempio: this.authService.login(credentials).subscribe(...)

    setTimeout(() => {
      this.isLoading = false;

      // Simulazione successo
      console.log('Login effettuato con successo!');
      alert('Login effettuato con successo!');

      // Naviga alla dashboard o home page
      // this.router.navigate(['/dashboard']);

      // In caso di errore:
      // this.handleLoginError('Credenziali non valide');
    }, 1500);
  }

  /**
   * Gestisce gli errori di login
   */
  private handleLoginError(errorMessage: string): void {
    this.isLoading = false;
    alert(errorMessage);

    // Oppure mostra un messaggio di errore più elegante
    // this.errorMessage = errorMessage;
  }

  /**
   * Getter di utility per accedere facilmente ai controlli del form
   */
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get rememberMe() {
    return this.loginForm.get('rememberMe');
  }

}
