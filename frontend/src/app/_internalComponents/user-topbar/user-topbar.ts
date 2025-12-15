import { Component, Inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { UserDialogComponent } from '../user-dialog/user-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../_services/auth/auth.service';
import { User } from '../user-card/user-card';
import { Subscription } from 'rxjs';
import { ToastService } from '../../_services/toast/toast.service';
import { FormsModule } from '@angular/forms'; // Aggiungi questo

@Component({
  selector: 'app-user-topbar',
  standalone: true,
  imports: [MatDialogModule, FormsModule], // Aggiungi FormsModule
  templateUrl: './user-topbar.html'
})
export class UserTopbar implements OnInit {

  @Input() currentUser!: User;
  @Output() searchChange = new EventEmitter<string>(); // Nuovo output

  searchTerm: string = ''; // Nuovo
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
  }

  // Nuovo metodo
  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm);
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
          `Email: ${userData.email}\nPassword: ${password}\n\nCopia la password ora, non sarà più visibile.`,
          false,
          password
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