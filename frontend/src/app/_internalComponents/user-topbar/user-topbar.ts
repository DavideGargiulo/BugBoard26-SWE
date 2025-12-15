import { Component, Inject, Input, OnInit } from '@angular/core';
import { UserDialogComponent } from '../user-dialog/user-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../_services/auth/auth.service';
import { User } from '../user-card/user-card';
import { Subscription } from 'rxjs';
import { ToastService } from '../../_services/toast/toast.service';

@Component({
  selector: 'app-user-topbar',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './user-topbar.html'
})

export class UserTopbar implements OnInit {

  @Input() currentUser!: User;
  private userSubscription: Subscription | null = null;

  constructor(
    @Inject(MatDialog) public dialog: MatDialog,
    private readonly authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {

    this.userSubscription = this.authService.currentUser$.subscribe(backendUser => {
      if (backendUser) {
        this.currentUser = {
          name: backendUser.name || `${backendUser.given_name} ${backendUser.family_name}`,
          email: '',
          role: this.extractRole(backendUser)
        };
      } else {
        this.currentUser = { name: 'Ospite', email: '', role: '' };
      }
    });

    this.toastService.success(
      'Successo!',
      `messaggio di successo.`,
      false,
      'Succeesso'
    );

    this.toastService.error(
      'Errore!',
      `messaggio di errore.`,
      false,
      'Errore'
    );

    this.toastService.info(
      'Info!',
      `messaggio di info.`,
      false,
      'Info'
    );

    this.toastService.warning(
      'Attenzione!',
      `messaggio di attenzione.`,
      false,
      'Attenzione'
    );

  }

  private extractRole(user: any): string {
    const roles = user.realm_access?.roles || [];

    if (roles.includes('Amministratore')) return 'Amministratore';
    return 'Standard';
  }

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

        this.toastService.success(
          'Utente creato con successo!',
          `Email: ${userData.email}\nPassword: ${password}\n\nCopia la password ora, non sarà più visibile.`
        );
      },
      error: (err) => {
        console.error('Errore registrazione:', err);
        this.toastService.error(
          'Errore nella registrazione',
          err.error?.error || 'Impossibile creare utente'
        );
      }
    });
  }

  canCreateUser(): boolean {
    return this.currentUser.role === 'Amministratore'
  }

}
