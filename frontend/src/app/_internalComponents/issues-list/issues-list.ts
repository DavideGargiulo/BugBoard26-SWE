import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueCardComponent, Issue } from '../issue-card/issue-card';

@Component({
  selector: 'app-issues-list',
  standalone: true,
  imports: [CommonModule, IssueCardComponent],
  templateUrl: './issues-list.html',
  styleUrl: './issues-list.css',
})

export class IssuesListComponent implements OnInit {
  @Input() issues: Issue[] = [];
  @Input() itemsPerPage: number = 4;

  currentPage: number = 1;
  paginatedIssues: Issue[] = [];
  totalPages: number = 1;

  ngOnInit() {
    this.calculatePagination();
  }

  ngOnChanges() {
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.issues.length / this.itemsPerPage);
    this.updatePaginatedIssues();
  }

  updatePaginatedIssues() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedIssues = this.issues.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePaginatedIssues();
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedIssues();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedIssues();
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}