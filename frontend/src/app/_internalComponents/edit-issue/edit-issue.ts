import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../_services/toast/toast.service';
import { IssueService } from '../../_services/issue/issue.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../_services/auth/auth.service';

@Component({
  selector: 'app-edit-issue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-issue.html'
})
export class EditIssueComponent implements OnInit {

  @ViewChild('content') content!: ElementRef<HTMLDivElement>;

  issueId: number = 0;
  issue: any = null;
  loading: boolean = true;
  error: string = '';

  uploadedImages: File[] = [];
  imagePreviewUrls: string[] = [];

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly issueService = inject(IssueService);
  private userSubscription: Subscription | null = null;
  private currentUser: { email: any; isAdmin: any; } = { email: '', isAdmin: false };

  constructor(
    private readonly cdr: ChangeDetectorRef,
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

        if (!this.canEditIssue()) {
          this.toastService.error(
            'Accesso negato',
            'Non hai i permessi per modificare questa issue'
          );
          this.router.navigate(['/']);
          return;
        }

        if (this.isCompleted()){
          this.toastService.error(
            'Accesso negato',
            'Non puoi modificare una issue completata'
          );
          this.router.navigate(['/']);
          return;
        }

        setTimeout(() => {
          if (this.content?.nativeElement) {
            this.content.nativeElement.innerHTML = '';
          }
        });

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

      if (this.uploadedImages.length + files.length > maxFiles) {
        this.toastService.error(
          'Errore caricamento file',
          `Puoi caricare un massimo di ${maxFiles} file per volta`
        );
        return;
      }

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

      this.uploadedImages.push(...files);

      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          this.imagePreviewUrls.push(url);
        } else {
          this.imagePreviewUrls.push('');
        }
      });

      setTimeout(() => {
        this.cdr.detectChanges();
      });
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

  submitEdit(): void {
    const descriptionHtml = this.content.nativeElement.innerHTML.trim();

    if (!descriptionHtml) {
      this.toastService.error(
        'Attenzione',
        'Inserisci un testo per aggiornare l\'issue'
      );
      return;
    }

    const existingCount = this.issue.attachments ? this.issue.attachments.length : 0;
    const newCount = this.uploadedImages.length;

    if (existingCount + newCount > 3) {
      this.toastService.error(
        'Limite allegati superato',
        `L'issue ha già ${existingCount} allegati. Ne stai aggiungendo ${newCount}. Il massimo totale è 3.`
      );
      return;
    }


    this.issueService.updateIssue(this.issueId, {
      descrizione: descriptionHtml,
      newAttachments: this.uploadedImages
    }).subscribe({
      next: (response) => {
        console.log('Issue aggiornata:', response);
        this.toastService.success('Successo', 'Aggiornamento aggiunto correttamente');

        // Reset
        this.uploadedImages = [];
        this.imagePreviewUrls = [];

        this.router.navigate(['/issue', this.issueId]);
      },
      error: (error) => {
        console.error('Errore update:', error);
        const msg = error.error?.message || 'Impossibile aggiornare la issue';
        this.toastService.error('Errore', msg);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/issue', this.issueId]);
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2) : '??';
  }

  getFileName(file: File): string {
    return file.name;
  }

  isImage(file: File): boolean {
    return file.type.startsWith('image/');
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

  getAttachmentUrl(attachment: any): string {
    if (!attachment?.percorso_relativo) return '';
    const normalizedPath = attachment.percorso_relativo.replaceAll('\\', '/');
    return `http://localhost:3000/${normalizedPath}`;
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