import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html'
})
export class App {

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
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // NON salvare in localStorage, così al prossimo caricamento ricontrolla il sistema
    }
  }

}
