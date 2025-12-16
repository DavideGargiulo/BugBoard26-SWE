import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserCardComponent, User } from '../user-card/user-card';
import { AuthService } from '../../_services/auth/auth.service';
import { ToastService } from '../../_services/toast/toast.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, UserCardComponent],
  templateUrl: './users-list.html'
})
export class UserListComponent implements OnInit, OnChanges {

  @Input() users: User[] = [];
  @Input() searchTerm: string = '';
  @Input() roleFilter: string = ''; // Nuovo input
  @Input() itemsPerPage: number = 4;

  currentPage: number = 1;
  paginatedUsers: User[] = [];
  filteredUsers: User[] = [];
  totalPages: number = 1;

  constructor(
    private readonly authService: AuthService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit() {
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['users'] || changes['searchTerm'] || changes['roleFilter']) {
      this.currentPage = 1;
      this.applyFilters();
    }
  }

  applyFilters() {
    let filtered = [...this.users];

    // Filtro per ruolo
    if (this.roleFilter && this.roleFilter.trim() !== '') {
      filtered = filtered.filter(user => user.role === this.roleFilter);
    }

    // Filtro per ricerca (solo nome ed email)
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    this.filteredUsers = filtered;
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
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
        this.users = this.users.filter(u => u.email !== user.email);
        this.applyFilters();

        if (this.paginatedUsers.length === 0 && this.currentPage > 1) {
          this.currentPage--;
          this.updatePaginatedUsers();
        }
      },
      error: (error) => {
        console.error('Errore durante l\'eliminazione dell\'utente:', error);
        this.toastService.error(
          'Errore eliminazione utente',
          'Si è verificato un errore durante l\'eliminazione dell\'utente. Riprova.'
        );
      }
    });
  }
}