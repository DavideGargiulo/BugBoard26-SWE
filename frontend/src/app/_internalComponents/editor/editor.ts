import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../_services/toast/toast.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.html',
  styleUrls: ['./editor.css']
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('content') content!: ElementRef<HTMLDivElement>;

  // Input per personalizzare l'aspetto
  @Input() containerClass: string = 'flex-1 min-h-0';
  @Input() editorClass: string = `
    border border-t-0 border-gray-300 dark:border-gray-700
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
    p-3 sm:p-6 outline-none break-words
    flex-1 min-h-0 overflow-y-auto
    scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200
    dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800
  `;
  @Input() placeholder: string = '';
  @Input() maxFiles: number = 3;
  @Input() maxFileSize: number = 5 * 1024 * 1024; // 5MB
  @Input() allowedExtensions: string[] = ['png', 'jpg', 'jpeg', 'pdf'];

  // Output events
  @Output() contentChange = new EventEmitter<string>();
  @Output() filesChange = new EventEmitter<File[]>();

  uploadedImages: File[] = [];
  imagePreviewUrls: string[] = [];

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly toastService: ToastService
  ) {}

  ngAfterViewInit(): void {
    // Applica la classe rounded-b-lg se non ci sono immagini
    this.updateEditorBorderClass();
  }

  ngOnDestroy(): void {
    // Cleanup object URLs
    this.imagePreviewUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
  }

  // Metodo pubblico per ottenere il contenuto HTML
  getContent(): string {
    return this.content?.nativeElement?.innerHTML || '';
  }

  // Metodo pubblico per pulire l'editor
  clear(): void {
    if (this.content?.nativeElement) {
      this.content.nativeElement.innerHTML = '';
    }

    // Cleanup URLs
    this.imagePreviewUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });

    this.uploadedImages = [];
    this.imagePreviewUrls = [];
    this.filesChange.emit([]);
    this.updateEditorBorderClass();
  }

  // Metodo pubblico per ottenere i file caricati
  getFiles(): File[] {
    return this.uploadedImages;
  }

  formatDoc(cmd: string, value: any = null): void {
    document.execCommand(cmd, false, value);
    this.content.nativeElement.focus();
  }

  onContentChange(): void {
    const html = this.content.nativeElement.innerHTML;
    this.contentChange.emit(html);
  }

  triggerImageUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.allowedExtensions.map(ext => `.${ext}`).join(',');
    input.multiple = true;
    input.onchange = (e) => this.onImageUpload(e);
    input.click();
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files) return;

    const files = Array.from(input.files);

    // Controllo numero massimo
    if (this.uploadedImages.length + files.length > this.maxFiles) {
      this.toastService.error(
        'Errore caricamento file',
        `Puoi caricare un massimo di ${this.maxFiles} file`
      );
      return;
    }

    // Validazione file
    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !this.allowedExtensions.includes(extension)) {
        this.toastService.error(
          'Errore caricamento file',
          `Il file "${file.name}" non è valido. Sono ammessi: ${this.allowedExtensions.join(', ')}`
        );
        return;
      }

      if (file.size > this.maxFileSize) {
        const maxSizeMB = (this.maxFileSize / (1024 * 1024)).toFixed(0);
        this.toastService.error(
          'Errore caricamento file',
          `Il file "${file.name}" supera i ${maxSizeMB}MB di dimensione massima`
        );
        return;
      }
    }

    // Aggiungi file
    this.uploadedImages.push(...files);

    // Genera preview URLs
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        this.imagePreviewUrls.push(url);
      } else {
        this.imagePreviewUrls.push('');
      }
    });

    this.filesChange.emit(this.uploadedImages);
    this.updateEditorBorderClass();

    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }

  removeImage(index: number): void {
    if (this.imagePreviewUrls[index]) {
      URL.revokeObjectURL(this.imagePreviewUrls[index]);
    }

    this.uploadedImages.splice(index, 1);
    this.imagePreviewUrls.splice(index, 1);

    this.filesChange.emit(this.uploadedImages);
    this.updateEditorBorderClass();
  }

  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private updateEditorBorderClass(): void {
    if (!this.content?.nativeElement) return;

    const element = this.content.nativeElement;
    if (this.uploadedImages.length === 0) {
      element.classList.add('rounded-b-lg');
    } else {
      element.classList.remove('rounded-b-lg');
    }
  }
}