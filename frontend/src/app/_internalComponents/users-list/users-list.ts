import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserCardComponent, User } from '../user-card/user-card';
import { AuthService } from '../../_services/auth/auth.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, UserCardComponent],
  templateUrl: './users-list.html'
})


export class UserListComponent implements OnInit, OnChanges {

  @Input() users: User[] = [];
  @Input() itemsPerPage: number = 4;

  currentPage: number = 1;
  paginatedUsers: User[] = [];
  totalPages: number = 1;

  constructor(private readonly authService: AuthService) {}

  ngOnInit() {
    this.calculatePagination();
  }

  ngOnChanges() {
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.users.length / this.itemsPerPage);
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.users.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePaginatedUsers();
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedUsers();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedUsers();
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onUserDelete(user: User): void {
    this.authService.deleteUser(user.email).subscribe({
      next: (response) => {
        console.log('Utente eliminato con successo:', response);

        // Rimuovi l'utente dalla lista locale
        this.users = this.users.filter(u => u.email !== user.email);

        // Ricalcola la paginazione
        this.calculatePagination();

        // Se la pagina corrente è vuota e non è la prima, torna alla precedente
        if (this.paginatedUsers.length === 0 && this.currentPage > 1) {
          this.currentPage--;
          this.updatePaginatedUsers();
        }
      },
      error: (error) => {
        console.error('Errore durante l\'eliminazione dell\'utente:', error);
        alert('Errore durante l\'eliminazione dell\'utente. Riprova.');
      }
    });
  }
}
