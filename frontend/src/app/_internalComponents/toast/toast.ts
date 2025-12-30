import { Component, OnDestroy, OnInit } from '@angular/core';
import { Toast, ToastService } from '../../_services/toast/toast.service';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  animations: [
    trigger('toastAnimation', [
      // Entrata: Slide in da destra
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      // Uscita: Dissolvenza (Fade out)
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ],
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  copiedIds = new Set<string>();
  private readonly timeouts = new Map<string, any>();

  constructor(private readonly toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toasts$.subscribe(toast => {
      console.log('Toast ricevuto con ID:', toast.id);
      this.toasts.push(toast);

      // Rimuovi automaticamente solo se autoDismiss è true
      if (toast.autoDismiss) {
        const timeout = setTimeout(() => {
          this.removeToast(toast.id);
        }, 5000);
        this.timeouts.set(toast.id, timeout);
      }
    });
  }

  removeToast(id: string) {
    // Cancella il timeout specifico per questo toast
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }

    // Rimuovi solo il toast con questo ID specifico
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.copiedIds.delete(id);
  }

  copyToClipboard(text: string, toastId: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Aggiungi solo l'ID specifico
      this.copiedIds.add(toastId);

      // Rimuovi solo questo ID specifico dopo 2 secondi
      setTimeout(() => {
        this.copiedIds.delete(toastId);
      }, 2000);
    }).catch(err => {
      console.error('Errore nella copia:', err);
    });
  }

  // TrackBy function per ottimizzare il rendering
  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  ngOnDestroy() {
    // Pulisci tutti i timeout quando il componente viene distrutto
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
}
