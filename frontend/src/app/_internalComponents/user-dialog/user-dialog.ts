import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.html',
  styleUrls: ['./user-dialog.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ]
})

export class UserDialogComponent {
  newUserForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder
  ) {
    this.newUserForm = this.fb.group({
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      ruolo: ['Standard', Validators.required]
    });
  }

  userData = {
    nome: '',
    cognome: '',
    email: '',
    ruolo: 'Standard'
  };

  onSubmit(): void {
    if (this.newUserForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      // Estraiamo i valori dal form
      const { nome, cognome, email, ruolo } = this.newUserForm.value;

      this.userData = { nome, cognome, email, ruolo };
    }
  }
}