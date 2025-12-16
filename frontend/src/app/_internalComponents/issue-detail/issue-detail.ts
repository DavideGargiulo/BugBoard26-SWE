import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../_services/toast/toast.service';

interface Comment {
  id: number;
  author: string;
  text: string;
  date: Date;
}

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issue-detail.html'
})
export class IssueDetailComponent implements OnInit {
  issueId: number = 0;
  issue: any = null;
  loading: boolean = true;
  error: string = '';

  comments: Comment[] = [];
  newComment: string = '';


  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.issueId = +params['id'];
      this.loadIssueDetail();
    });
  }

  loadIssueDetail(): void {
    this.loading = false;
    this.issue = {
          id: 1,
          title: "Titolo",
          description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at tempor urna. Praesent aliquet dictum laoreet. Nunc dictum enim urna, id lobortis nisi gravida eget. Proin accumsan metus quis scelerisque ultricies. Etiam at mi a risus ornare semper quis sed lorem. In a faucibus nulla, quis vestibulum justo. Nulla luctus nisi dui, vel consectetur elit venenatis nec. Fusce eu mollis orci. Etiam volutpat erat eu venenatis ullamcorper. Quisque sollicitudin metus et tortor imperdiet venenatis. Etiam mattis purus non erat dictum, sed venenatis leo pellentesque. Nam mattis id nisi sagittis egestas. Cras suscipit eros dapibus mauris faucibus tempus. In eu quam sodales, ultricies mauris ac, vestibulum est. Vestibulum sodales lacus tempor venenatis molestie. Morbi blandit enim non finibus sollicitudin. Phasellus nisi lectus, eleifend sed enim id, tincidunt dignissim tortor. Sed magna odio, lacinia sit amet augue eu, condimentum vehicula eros. Donec mauris arcu, sagittis ac metus quis, hendrerit efficitur purus. Nunc venenatis purus elit, non pulvinar dolor interdum ut. Morbi nec feugiat nibh. Sed gravida elit ac dui consequat ultricies. Sed lacinia viverra arcu, ac vehicula dolor consectetur tristique. Nulla varius imperdiet volutpat. Phasellus ornare sem ut interdum tempor. Integer et imperdiet felis. Praesent dapibus eleifend nisl, et ornare urna tincidunt et. Nam ultricies risus sed euismod consequat. Proin fermentum, dolor eget vulputate rhoncus, est justo vulputate nisl, rhoncus varius turpis ipsum nec felis. Donec finibus risus vitae odio viverra, sed fringilla neque efficitur. In hac habitasse platea dictumst. Cras id finibus leo. Fusce eget odio urna. Ut non magna eget ligula efficitur elementum. Maecenas rutrum luctus erat quis accumsan. Nam viverra ac lectus a efficitur. Mauris erat risus, facilisis eget urna ac, suscipit tristique erat. In ultricies cursus dui sed venenatis. Suspendisse in lectus at eros commodo suscipit. Phasellus id neque id metus tincidunt sodales. Aliquam hendrerit pellentesque mi, eget finibus neque. Proin mollis elit sem, dictum interdum purus eleifend convallis. Vivamus condimentum facilisis leo, sed scelerisque mauris varius id. Aliquam blandit arcu ut neque scelerisque, eu facilisis augue consectetur. Curabitur volutpat arcu vitae ultrices cursus. Maecenas et lorem placerat, sollicitudin risus tempus, vulputate dolor. Sed id libero luctus, blandit nunc vitae, elementum ipsum. Cras tincidunt quis elit lobortis facilisis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Morbi vel sapien sed odio blandit euismod eget sit amet ex. Maecenas hendrerit scelerisque risus vitae tempor. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Vestibulum ornare mi vel purus ullamcorper fringilla. Suspendisse in viverra metus. Ut sed velit tempus, dignissim lorem et, venenatis erat. Mauris euismod tincidunt velit, at posuere est facilisis et. In hac habitasse platea dictumst. Vivamus pellentesque tortor sit amet condimentum interdum. Nullam commodo eros ut diam pretium feugiat. Nunc velit quam, feugiat nec vehicula sit amet, cursus eget dolor. Suspendisse nec mauris ac nulla luctus venenatis sed a lectus. Nunc quis sapien condimentum diam maximus blandit. Mauris mattis congue massa, vitae imperdiet massa iaculis et. Curabitur finibus risus et mauris suscipit, vitae imperdiet nulla posuere. Curabitur pharetra tellus vel lacus elementum efficitur.",
          tags: ["tipo", "priorita", "stato"],
          commentsCount: 0,
          assignee: "Creatore",
          project: "Progetto"
        };
    this.comments = [
          {
            id: 1,
            author: 'Nome Cognome',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
            date: new Date()
          },
          {
            id: 2,
            author: 'Nome Cognome',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
            date: new Date()
          },
          {
            id: 3,
            author: 'Nome Cognome',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
            date: new Date()
          },
          {
            id: 4,
            author: 'Nome Cognome',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
            date: new Date()
          },
          {
            id: 4,
            author: 'Nome Cognome',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
            date: new Date()
          },
          {
            id: 4,
            author: 'Nome Cognome',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
            date: new Date()
          },
          {
            id: 4,
            author: 'Nome Cognome',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
            date: new Date()
          },
          {
            id: 4,
            author: 'Nome Cognome',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
            date: new Date()
          }
        ];
    // this.issueService.getIssueById(this.issueId).subscribe({
    //   next: (data) => {
    //     this.issue = {
    //       id: data.id,
    //       title: data.titolo,
    //       description: data.descrizione,
    //       tags: [data.tipo, data.priorita, data.stato],
    //       commentsCount: data.numeroCommenti,
    //       assignee: data.Creatore.nome,
    //       project: data.progetto || 'Project 1'
    //     };

    //     // Mock comments - sostituisci con il caricamento reale dal backend
    //     this.comments = [
    //       {
    //         id: 1,
    //         author: 'Nome Cognome',
    //         text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
    //         date: new Date()
    //       },
    //       {
    //         id: 2,
    //         author: 'Nome Cognome',
    //         text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
    //         date: new Date()
    //       },
    //       {
    //         id: 3,
    //         author: 'Nome Cognome',
    //         text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
    //         date: new Date()
    //       },
    //       {
    //         id: 4,
    //         author: 'Nome Cognome',
    //         text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt lobortis lorem quis cursus. Morbi ut mattis lacus. Duis ut orci vel diam elementum iaculis.',
    //         date: new Date()
    //       }
    //     ];

    //     this.loading = false;
    //   },
    //   error: (err) => {
    //     console.error('Errore caricamento issue:', err);
    //     this.error = 'Errore nel caricamento dei dettagli dell\'issue';
    //     this.loading = false;
    //   }
    // });
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  uploadedImages: File[] = [];
  imagePreviewUrls: string[] = [];

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

  closeIssue(): void {
    // Implementa la logica per chiudere l'issue
    console.log('Chiudi issue');
  }
}