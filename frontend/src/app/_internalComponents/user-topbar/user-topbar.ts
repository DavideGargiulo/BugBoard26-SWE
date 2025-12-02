import { Component, Inject } from '@angular/core';
import { UserDialogComponent } from '../user-dialog/user-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../_services/auth/auth.service';

@Component({
  selector: 'app-user-topbar',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './user-topbar.html'
})

export class UserTopbar {

  constructor(@Inject(MatDialog) public dialog: MatDialog, private readonly authService: AuthService) {}

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
        this.createUser(result);
      } else {
        console.log('Dialog chiuso senza conferma');
      }
    });
  }

  createUser(userData: any): void {
    this.authService.register(userData).subscribe({
      next: (response: any) => {
        const password = response.password;

        alert(
          `UTENTE CREATO CON SUCCESSO!\n\n` +
          `Email: ${userData.email}\n` +
          `Password: ${password}\n\n` +
          `Copia la password ora, non sarà più visibile.`
        );
      },
      error: (err) => {
        console.error('Errore registrazione:', err);
        alert('Errore: ' + (err.error?.error || 'Impossibile creare utente'));
      }
    });
  }
}
