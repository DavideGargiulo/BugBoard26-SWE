import { Component, Inject } from '@angular/core';
import { UserDialogComponent } from '../user-dialog/user-dialog';

@Component({
  selector: 'app-user-topbar',
  standalone: true,
  imports: [],
  templateUrl: './user-topbar.html'
})

export class UserTopbar {

  openAddUserDialog(): void {
  }

  createUser(userData: any): void {
    // TODO: Aggiungere implementazione per creazione utente
    console.log('Creazione utente:', userData);
  }

}
