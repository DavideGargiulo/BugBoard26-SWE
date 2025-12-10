import { Component, ElementRef, ViewChild, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-new-issue',
  templateUrl: './new-issue.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class NewIssueComponent implements OnInit {
  @ViewChild('content') content!: ElementRef<HTMLDivElement>;
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any>();

  constructor(
    private readonly router: Router,
    private route: ActivatedRoute
  ) {}

  title: string = '';
  tipo: string = '';
  priorita: string = '';
  projectName: string = '';
  uploadedImages: File[] = [];

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
    if (input.files && input.files.length > 0) {
      const maxFiles = 3;
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      const allowedExtensions = ['png', 'jpg', 'jpeg', 'pdf'];

      Array.from(input.files).forEach(file => {
        // Controlla numero massimo di file
        if (this.uploadedImages.length >= maxFiles) {
          alert(`Puoi caricare un massimo di ${maxFiles} file`);
          return;
        }

        // Controlla estensione
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !allowedExtensions.includes(extension)) {
          alert(`Il file "${file.name}" non è valido. Sono ammessi solo file .png, .jpg, .jpeg o .pdf`);
          return;
        }

        // Controlla dimensione
        if (file.size > maxSize) {
          alert(`Il file "${file.name}" supera i 5MB. Dimensione massima consentita: 5MB`);
          return;
        }

        this.uploadedImages.push(file);
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
    this.uploadedImages.splice(index, 1);
  }

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  onCancel(): void {
    this.cancel.emit();
    this.router.navigate(['/progetto/', this.projectName]);
  }

  onConfirm(): void {
    if (!this.title.trim()) {
      alert('Il titolo è obbligatorio');
      return;
    }
    if (!this.tipo) {
      alert('Seleziona un tipo');
      return;
    }
    if (!this.priorita) {
      alert('Seleziona una priorità');
      return;
    }

    const issue = {
      title: this.title,
      description: this.content.nativeElement.innerHTML,
      tipo: this.tipo,
      priorita: this.priorita,
      images: this.uploadedImages
    };

    console.log('Nuova issue creata:', issue);
    console.log('Immagini da caricare:', this.uploadedImages);

    this.confirm.emit(issue);

    // TODO: inviare l'issue al backend con FormData
    // const formData = new FormData();
    // formData.append('title', this.title);
    // formData.append('description', this.content.nativeElement.innerHTML);
    // formData.append('tipo', this.tipo);
    // formData.append('priorita', this.priorita);
    // this.uploadedImages.forEach((img, index) => {
    //   formData.append(`images[${index}]`, img);
    // });
  }
}