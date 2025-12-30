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
  private readonly userService = inject(UserService);

  users: User[] = [];
  searchTerm: string = '';
  roleFilter: string = ''; // Nuovo

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

  onSearchChange(term: string): void {
    this.searchTerm = term;
  }

  // Nuovo metodo
  onRoleFilterChange(role: string): void {
    this.roleFilter = role;
  }
}