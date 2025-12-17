import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../_services/toast/toast.service';
import { IssueService } from '../../_services/issue/issue.service';

interface Comment {
  id: number;
  author: string;
  text: string;
  date: Date;
  attachments?: Array<{
    id: number;
    nome_file_originale: string;
    tipo_mime: string;
    percorso_relativo: string;
  }>;
}

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issue-detail.html'
})
export class IssueDetailComponent implements OnInit {
  @ViewChild('content') content!: ElementRef<HTMLDivElement>;


  issueId: number = 0;
  issue: any = null;
  comments: Comment[] = [];
  loading: boolean = true;
  error: string = '';

  newComment: string = '';
  uploadedImages: File[] = [];
  imagePreviewUrls: string[] = [];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private issueService = inject(IssueService);

  constructor(
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.issueId = +params['id'];
      this.loadIssueDetail();
    });
  }

  loadIssueDetail(): void {
    this.loading = true;

    this.issueService.getIssueById(this.issueId).subscribe({
      next: (data) => {
        this.issue = {
          id: data.id,
          title: data.titolo,
          description: data.descrizione,
          tags: [data.tipo, data.stato, data.priorita],
          commentsCount: data.numeroCommenti,
          assignee: data.Creatore.nome,
          project: data.progetto.nome
        };

        this.comments = data.commenti.map((comment: any) => ({
          id: comment.id,
          author: comment.autore.nome,
          text: comment.testo,
          date: new Date(),
          attachments: comment.allegati
        }));

        this.loading = false;
      },
      error: (err) => {
        console.error('Errore caricamento issue:', err);
        this.error = 'Errore nel caricamento dei dettagli dell\'issue';
        this.loading = false;
      }
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

      // Genero gli URL per l'anteprima (solo per immagini, NON per PDF)
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          this.imagePreviewUrls.push(url);
        } else {
          // Per i PDF aggiungo una stringa vuota per mantenere gli indici allineati
          this.imagePreviewUrls.push('');
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

  submitComment(): void {
    const commentHtml = this.content.nativeElement.innerHTML.trim();

    if (!commentHtml) {
      this.toastService.error(
        'Commento vuoto',
        'Inserisci un testo'
      );
      return;
    }

    console.log('Invio commento:', {
      text: commentHtml,
      files: this.uploadedImages
    });

    // TODO chiamata backend
    // this.issueService.addComment(this.issueId, commentHtml, this.uploadedImages)

    // Reset editor
    this.content.nativeElement.innerHTML = '';
    this.uploadedImages = [];

    this.imagePreviewUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    this.imagePreviewUrls = [];

    this.toastService.success(
      'Commento inviato',
      'Il tuo commento è stato pubblicato'
    );
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  getFileName(file: File): string {
    return file.name;
  }

  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  closeIssue(): void {
    // Implementa la logica per chiudere l'issue
    console.log('Chiudi issue');
  }
}