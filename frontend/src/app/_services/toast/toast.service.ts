import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// src/app/services/toast.service.ts
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  autoDismiss?: boolean;
  copyText?: string;
}
@Injectable({
  providedIn: 'root',
})
export class ToastService {

  private toastSubject = new Subject<Toast>();
  public toasts$ = this.toastSubject.asObservable();
  private idCounter = 0; // Contatore per ID unici

  show(type: Toast['type'], title: string, message: string, autoDismiss: boolean = true, copyText?: string) {
    const toast: Toast = {
      id: `toast-${Date.now()}-${this.idCounter++}`, // ID univoco combinando timestamp e contatore
      type,
      title,
      message,
      autoDismiss,
      copyText
    };
    this.toastSubject.next(toast);
  }

  success(title: string, message: string, autoDismiss: boolean = true, copyText?: string) {
    this.show('success', title, message, autoDismiss, copyText);
  }

  error(title: string, message: string, autoDismiss: boolean = true, copyText?: string) {
    this.show('error', title, message, autoDismiss, copyText);
  }

  info(title: string, message: string, autoDismiss: boolean = true, copyText?: string) {
    this.show('info', title, message, autoDismiss, copyText);
  }

  warning(title: string, message: string, autoDismiss: boolean = true, copyText?: string) {
    this.show('warning', title, message, autoDismiss, copyText);
  }



}
