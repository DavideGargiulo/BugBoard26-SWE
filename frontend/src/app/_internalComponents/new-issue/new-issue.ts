import { Component, ViewChild, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../_services/project/project-service';
import { ToastService } from '../../_services/toast/toast.service';
import { EditorComponent } from '../editor/editor';

@Component({
  selector: 'app-new-issue',
  templateUrl: './new-issue.html',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorComponent]
})

export class NewIssueComponent implements OnInit {
  @ViewChild(EditorComponent) editor!: EditorComponent;

  @Output() cancelEvent = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any>();

  title: string = '';
  tipo: string = '';
  priorita: string = '';
  projectName: string = '';
  isLoading: boolean = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly projectService: ProjectService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectName = params['nome'];
      console.log('Nome progetto dall\'URL:', this.projectName);
    });
  }

  onCancel(): void {
    this.cancelEvent.emit();
    this.resetForm();
    this.router.navigate(['/progetto/', this.projectName]);
  }

  private resetForm(): void {
    this.title = '';
    this.tipo = '';
    this.priorita = '';
    this.editor?.clear();
  }

  onConfirm(): void {
    const description = this.editor.getContent().trim();
    const files = this.editor.getFiles();

    if (!this.title.trim()) {
      this.toastService.error(
        'Errore creazione issue',
        'Il titolo è obbligatorio'
      );
      return;
    }
    if (!description) {
      this.toastService.error(
        'Errore creazione issue',
        'La descrizione è obbligatoria'
      );
      return;
    }
    if (!this.tipo) {
      this.toastService.error(
        'Errore creazione issue',
        'Seleziona un tipo'
      );
      return;
    }
    if (!this.priorita) {
      this.toastService.error(
        'Errore creazione issue',
        'Seleziona una priorità'
      );
      return;
    }

    this.isLoading = true;

    const tipoSistemato = String(this.tipo).charAt(0).toUpperCase() + String(this.tipo).slice(1);
    const prioritaSistemata = String(this.priorita).charAt(0).toUpperCase() + String(this.priorita).slice(1);

    const formData = new FormData();
    formData.append('titolo', this.title);
    formData.append('descrizione', description);
    formData.append('tipo', tipoSistemato);
    formData.append('priorita', prioritaSistemata);
    formData.append('progetto', this.projectName);

    files.forEach((img) => {
      formData.append('images', img, img.name);
    });

    console.log('Invio issue al backend...');
    console.log('Titolo:', this.title);
    console.log('Tipo:', this.tipo);
    console.log('Priorità:', this.priorita);
    console.log('Progetto:', this.projectName);
    console.log('Numero immagini:', files.length);

    this.projectService.createIssue(formData).subscribe({
      next: (response) => {
        console.log('Issue creata con successo:', response);
        this.toastService.success(
          'Issue creata con successo',
          `L'issue "${this.title}" è stata creata nel progetto "${this.projectName}".`
        );
        this.confirm.emit(response);
        this.isLoading = false;
        this.resetForm();
        this.router.navigate(['/progetto/', this.projectName]);
      },
      error: (error) => {
        console.error('Errore nella creazione dell\'issue:', error);
        this.toastService.error(
          'Errore creazione issue',
          `Si è verificato un errore: ${error.error?.message || error.message}`
        );
        this.isLoading = false;
      }
    });
  }
}