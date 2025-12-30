import { Component, ElementRef, ViewChild, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../_services/project/project-service';
import { ToastService } from '../../_services/toast/toast.service';

@Component({
  selector: 'app-new-issue',
  templateUrl: './new-issue.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})

export class NewIssueComponent implements OnInit, OnDestroy {
  @ViewChild('content') content!: ElementRef<HTMLDivElement>;
  @Output() cancelEvent = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any>();

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly projectService: ProjectService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastService: ToastService
  ) {}

  title: string = '';
  tipo: string = '';
  priorita: string = '';
  projectName: string = '';
  uploadedImages: File[] = [];
  isLoading: boolean = false;
  imagePreviewUrls: string[] = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectName = params['nome'];
      console.log('Nome progetto dall\'URL:', this.projectName);
    });
  }

  formatDoc(cmd: string, value: any = null): void {
    document.execCommand(cmd, false, value);
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files) {
      const files = Array.from(input.files);

      const maxFiles = 3;
      const maxSize = 5 * 1024 * 1024;
      const allowedExtensions = ['png', 'jpg', 'jpeg', 'pdf'];

      // Controllo numero massimo
      if (this.uploadedImages.length + files.length > maxFiles) {
        this.toastService.error(
          'Errore caricamento file',
          `Puoi caricare un massimo di ${maxFiles} file`
        );
        return;
      }

      // Controlli su tutti i file PRIMA di caricare
      for (const file of files) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !allowedExtensions.includes(extension)) {
          this.toastService.error(
            'Errore caricamento file',
            `Il file "${file.name}" non è valido. Sono ammessi: ${allowedExtensions.join(', ')}`
          );
          return;
        }

        if (file.size > maxSize) {
          this.toastService.error(
            'Errore caricamento file',
            `Il file "${file.name}" supera i 5MB di dimensione massima`
          );
          return;
        }
      }

      // Se tutti validi → li aggiungo in una volta sola
      this.uploadedImages.push(...files);

      // Genero gli URL per l’anteprima (solo per immagini, NON per PDF)
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          this.imagePreviewUrls.push(url);
        }
      });

      // Change detection
      setTimeout(() => {
        this.cdr.detectChanges();
      });

      console.log('File caricati:', this.uploadedImages);
    }
  }


  triggerImageUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.png,.jpg,.jpeg,.pdf';
    input.multiple = true;
    input.onchange = (e) => this.onImageUpload(e);
    input.click();
  }

  removeImage(index: number): void {
    if (this.imagePreviewUrls[index]) {
      URL.revokeObjectURL(this.imagePreviewUrls[index]);
    }

    this.uploadedImages.splice(index, 1);
    this.imagePreviewUrls.splice(index, 1);
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

    this.imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));

    this.uploadedImages = [];
    this.imagePreviewUrls = [];

    if (this.content) {
      this.content.nativeElement.innerHTML = '';
    }
  }

  ngOnDestroy(): void {
    this.imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
  }

  onConfirm(): void {
    if (!this.title.trim()) {
      this.toastService.error(
        'Errore creazione issue',
        'Il titolo è obbligatorio'
      );
      return;
    }
    if (!this.content.nativeElement.innerHTML.trim()) {
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

    // Crea FormData per inviare dati + file
    const formData = new FormData();
    formData.append('titolo', this.title);
    formData.append('descrizione', this.content.nativeElement.innerHTML);
    formData.append('tipo', tipoSistemato);
    formData.append('priorita', prioritaSistemata);
    formData.append('progetto', this.projectName);

    // Aggiungi le immagini al FormData
    this.uploadedImages.forEach((img) => {
      formData.append('images', img, img.name);
    });

    console.log('Invio issue al backend...');
    console.log('Titolo:', this.title);
    console.log('Tipo:', this.tipo);
    console.log('Priorità:', this.priorita);
    console.log('Progetto:', this.projectName);
    console.log('Numero immagini:', this.uploadedImages.length);

    // Invia al backend
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
          `Si è verificato un errore durante la creazione dell'issue: ${error.error?.message || error.message}`
        );
        this.isLoading = false;
      }
    });

  }
}