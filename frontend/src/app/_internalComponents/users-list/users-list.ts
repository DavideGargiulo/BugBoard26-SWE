import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserCardComponent, User } from '../user-card/user-card';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, UserCardComponent],
  templateUrl: './users-list.html'
})


export class UserListComponent implements OnInit {

  @Input() users: User[] = [];
    @Input() itemsPerPage: number = 4;

    currentPage: number = 1;
    paginatedUsers: User[] = [];
    totalPages: number = 1;

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

}
