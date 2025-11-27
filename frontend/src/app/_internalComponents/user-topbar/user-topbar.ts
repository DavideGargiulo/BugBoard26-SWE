import { Component } from '@angular/core';
import { UserDialogComponent } from '../user-dialog/user-dialog';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-topbar',
  imports: [],
  templateUrl: './user-topbar.html'
})

export class UserTopbar {

  constructor(public dialog: MatDialog) {}

  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '450px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dati utente ricevuti:', result);
        // Qui puoi fare la chiamata API per creare l'utente
        this.createUser(result);
      } else {
        console.log('Dialog chiuso senza conferma');
      }
    });
  }

  createUser(userData: any): void {
    // TODO: Aggiungere implementazione per creazione utente
    console.log('Creazione utente:', userData);
  }

}
