import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { ToastComponent } from "./_internalComponents/toast/toast";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, MatDialogModule, ToastComponent],
  templateUrl: './app.html'
})
export class App implements OnInit {

  protected readonly title = signal('frontend');

  ngOnInit() {
    // Controlla se c'è un tema salvato dall'utente
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      // Se l'utente ha già scelto un tema, usa quello
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Altrimenti usa la preferenza del sistema
      const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // NON salvare in localStorage, così al prossimo caricamento ricontrolla il sistema
    }
  }

}
