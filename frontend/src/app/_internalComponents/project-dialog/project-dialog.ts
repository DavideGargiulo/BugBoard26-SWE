import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-project-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-dialog.html'
})

export class ProjectDialogComponent {
  newProjectForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ProjectDialogComponent>,
    private readonly fb: FormBuilder
  ) {
    this.newProjectForm = this.fb.group({
      nome: ['', Validators.required]
    });
  }

  projectData = {
    nome: ''
  };

  onSubmit(): void {
    if (this.newProjectForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      // Estraiamo i valori dal form
      const { nome } = this.newProjectForm.value;

      this.projectData = { nome };

      this.dialogRef.close(this.projectData);
    }
  }
}
