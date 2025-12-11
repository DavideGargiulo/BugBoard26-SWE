import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from "../_internalComponents/user-card/user-card";
import { UserListComponent } from '../_internalComponents/users-list/users-list';
import { UserTopbar } from "../_internalComponents/user-topbar/user-topbar";
import { UserService } from "../_services/user/user.service";

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, UserListComponent, UserTopbar],
  templateUrl: './users.html'
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);

  users: User[] = [
    // Esempio di utenti hardcoded
    // { name: 'Mario Rossi', role: 'Amministratore' },
    // { name: 'Luigi Bianchi', role: 'Standard' },
    // { name: 'Giulia Verdi', role: 'Amministratore' },
    // { name: 'Anna Neri', role: 'Standard' },
    // { name: 'Paolo Gialli', role: 'Standard' },
    // { name: 'Sara Blu', role: 'Amministratore' },
    // { name: 'Luca Viola', role: 'Standard' },
    // { name: 'Elena Arancioni', role: 'Amministratore' },
    // { name: 'Marco Grigi', role: 'Standard' },
    // { name: 'Laura Rosa', role: 'Standard' },
    // { name: 'Francesco Celesti', role: 'Amministratore' },
    // { name: 'Chiara Marroni', role: 'Standard' },
    // { name: 'Davide Turchesi', role: 'Amministratore' }
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        console.log('Utenti caricati:', data);
        this.users = data;
      },
      error: (err) => {
        console.log('Errore caricamente utenti:', err);
      }
    })
  }
}