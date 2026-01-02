import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../_services/toast/toast.service';
import { IssueService } from '../../_services/issue/issue.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../_services/auth/auth.service';
import { EditorComponent } from '../editor/editor';

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
    dimensione_byte: number;
  }>;
}

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorComponent],
  templateUrl: './issue-detail.html'
})

export class IssueDetailComponent implements OnInit {
  @ViewChild(EditorComponent) editor!: EditorComponent;

  issueId: number = 0;
  issue: any = null;
  comments: Comment[] = [];
  loading: boolean = true;
  error: string = '';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly issueService = inject(IssueService);
  private userSubscription: Subscription | null = null;
  private currentUser: { email: any; isAdmin: any; } = { email: '', isAdmin: false };

  constructor(
    private readonly authService: AuthService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.issueId = +params['id'];
      this.loadIssueDetail();
    });
  }

  onImageError(event: any): void {
    console.error('Errore caricamento immagine:', event.target.src);
    event.target.src = 'assets/image-error.png';
    event.target.style.display = 'none';
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
          creatorEmail: data.Creatore.email,
          project: data.progetto.nome,
          attachments: data.allegati || []
        };

        console.log('descrizione:\n', this.issue.description);

        this.comments = data.commenti.map((comment: any) => ({
          id: comment.id,
          author: comment.autore?.nome || 'Utente sconosciuto',
          text: comment.testo,
          date: new Date(),
          attachments: comment.allegati || []
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

  submitComment(): void {
    const commentHtml = this.editor.getContent().trim();
    const files = this.editor.getFiles();

    if (!commentHtml) {
      this.toastService.error(
        'Commento vuoto',
        'Inserisci un testo'
      );
      return;
    }

    console.log('Invio commento:', {
      text: commentHtml,
      files: files
    });

    this.issueService.createComment(this.issueId, {
      testo: commentHtml,
      attachments: files
    }).subscribe({
      next: (response) => {
        console.log('Commento creato con successo:', response);

        // Reset editor
        this.editor.clear();

        this.toastService.success(
          'Commento inviato',
          'Il tuo commento è stato pubblicato'
        );

        // Ricarica i commenti
        this.loadIssueDetail();
      },
      error: (error) => {
        console.error('Errore durante l\'invio del commento:', error);
        this.toastService.error(
          'Errore',
          'Impossibile inviare il commento'
        );
      }
    });
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

  canEditIssue(): boolean {
    this.userSubscription = this.authService.currentUser$.subscribe(backendUser => {
      if (backendUser) {
        this.currentUser = {
          email: backendUser.email || '',
          isAdmin: backendUser.realm_access?.roles.includes('Amministratore') || false
        };
      }
    });
    return this.currentUser.email === this.issue.creatorEmail || this.currentUser.isAdmin;
  }

  isCompleted(): boolean {
    return this.issue.tags.includes('Done');
  }

  editIssue(): void {
    this.router.navigate(['/issue', this.issueId, 'modifica']);
  }

  completeIssue(): void {
    this.issueService.completeIssue(this.issue.id).subscribe({
      next: (res) => {
        console.log('Issue completata', res);
        this.issue.stato = 'Done';
        this.toastService.success('Fatto', 'Issue completata con successo');
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/issue', this.issueId]);
        });
      },
      error: (err) => {
        console.error('Errore completamento issue', err);
        this.toastService.error('Errore', err.error?.message || 'Errore nel completamento della issue');
      }
    });
  }

  getAttachmentUrl(attachment: any): string {
    if (!attachment?.percorso_relativo) {
      console.error('Attachment mancante o percorso non valido:', attachment);
      return '';
    }
    const normalizedPath = attachment.percorso_relativo.replaceAll('\\', '/');
    const url = `http://localhost:3000/${normalizedPath}`;
    console.log('URL generato per attachment:', url);
    return url;
  }

  isImageAttachment(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  isPdfAttachment(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  downloadAttachment(attachment: any): void {
    const url = this.getAttachmentUrl(attachment);
    window.open(url, '_blank');
  }
}
