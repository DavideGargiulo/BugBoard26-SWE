import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueCardComponent, Issue } from '../issue-card/issue-card';

@Component({
  selector: 'app-issues-list',
  standalone: true,
  imports: [CommonModule, IssueCardComponent],
  templateUrl: './issues-list.html'
})

export class IssuesListComponent implements OnInit, OnChanges {
  @Input() issues: Issue[] = [];
  @Input() itemsPerPage: number = 4;
  @Input() searchTerm: string = '';
  @Input() tipoFilter: string = '';
  @Input() statoFilter: string = '';
  @Input() prioritaFilter: string = '';

  @Output() statisticsChange = new EventEmitter<{todo: number, inProgress: number, done: number}>();

  currentPage: number = 1;
  paginatedIssues: Issue[] = [];
  filteredIssues: Issue[] = [];
  totalPages: number = 1;
  private statisticsCalculated: boolean = false;

  ngOnInit() {
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Calcola le statistiche solo quando cambiano le issue iniziali
    if (changes['issues'] && !changes['issues'].firstChange) {
      this.calculateStatistics();
      this.statisticsCalculated = true;
    }

    // Calcola statistiche alla prima inizializzazione
    if (changes['issues'] && changes['issues'].firstChange && this.issues.length > 0) {
      this.calculateStatistics();
      this.statisticsCalculated = true;
    }

    if (changes['issues'] || changes['searchTerm'] ||
        changes['tipoFilter'] || changes['statoFilter'] || changes['prioritaFilter']) {
      this.currentPage = 1;
      this.applyFilters();
    }
  }

  applyFilters() {
    let filtered = [...this.issues];

    // Filtro per tipo
    if (this.tipoFilter && this.tipoFilter.trim() !== '') {
      filtered = filtered.filter(issue =>
        issue.tags.some(tag => tag.toLowerCase() === this.tipoFilter.toLowerCase())
      );
    }

    // Filtro per stato
    if (this.statoFilter && this.statoFilter.trim() !== '') {
      filtered = filtered.filter(issue =>
        issue.tags.some(tag => tag.toLowerCase() === this.statoFilter.toLowerCase())
      );
    }

    // Filtro per priorità
    if (this.prioritaFilter && this.prioritaFilter.trim() !== '') {
      filtered = filtered.filter(issue =>
        issue.tags.some(tag => tag.toLowerCase() === this.prioritaFilter.toLowerCase())
      );
    }

    // Filtro per ricerca (titolo + id)
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(term) ||
        issue.id.toString().includes(term)
      );
    }

    this.filteredIssues = filtered;

    // Calcola statistiche solo se non sono già state calcolate
    if (!this.statisticsCalculated && this.issues.length > 0) {
      this.calculateStatistics();
      this.statisticsCalculated = true;
    }

    this.calculatePagination();
  }

  calculateStatistics() {
    const total = this.issues.length; // Usa tutte le issue, non quelle filtrate

    if (total === 0) {
      this.statisticsChange.emit({ todo: 0, inProgress: 0, done: 0 });
      return;
    }

    const todoCount = this.issues.filter(issue =>
      issue.tags.some(tag => tag.toLowerCase() === 'todo')
    ).length;

    const inProgressCount = this.issues.filter(issue =>
      issue.tags.some(tag => tag.toLowerCase() === 'in-progress')
    ).length;

    const doneCount = this.issues.filter(issue =>
      issue.tags.some(tag => tag.toLowerCase() === 'done')
    ).length;

    // Usa decimali precisi
    const todoPercentage = (todoCount / total) * 100;
    const inProgressPercentage = (inProgressCount / total) * 100;
    const donePercentage = (doneCount / total) * 100;

    this.statisticsChange.emit({
      todo: todoPercentage,
      inProgress: inProgressPercentage,
      done: donePercentage
    });
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredIssues.length / this.itemsPerPage);
    this.updatePaginatedIssues();
  }

  updatePaginatedIssues() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedIssues = this.filteredIssues.slice(startIndex, endIndex);
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

  // Restituisce le pagine visibili (max 4)
getVisiblePages(): number[] {
  const maxVisible = 4;
  const pages: number[] = [];

  if (this.totalPages <= maxVisible) {
    // Se ci sono 4 o meno pagine totali, mostra tutte
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Logica per mostrare 4 pagine con la pagina corrente al centro quando possibile
    let startPage: number;
    let endPage: number;

    if (this.currentPage <= 2) {
      // Vicino all'inizio
      startPage = 2;
      endPage = Math.min(4, this.totalPages - 1);
    } else if (this.currentPage >= this.totalPages - 1) {
      // Vicino alla fine
      startPage = Math.max(2, this.totalPages - 3);
      endPage = this.totalPages - 1;
    } else {
      // Nel mezzo
      startPage = this.currentPage - 1;
      endPage = this.currentPage + 1;
    }

    // Aggiungi le pagine al range visibile
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < this.totalPages) {
        pages.push(i);
      }
    }
  }

  return pages;
}

// Mostra la prima pagina se totalPages > 4 e non è già nelle pagine visibili
  shouldShowFirstPage(): boolean {
    if (this.totalPages <= 4) return false;
    const visiblePages = this.getVisiblePages();
    return !visiblePages.includes(1);
  }

  // Mostra l'ultima pagina se totalPages > 4 e non è già nelle pagine visibili
  shouldShowLastPage(): boolean {
    if (this.totalPages <= 4) return false;
    const visiblePages = this.getVisiblePages();
    return !visiblePages.includes(this.totalPages);
  }

  // Mostra ellipsis a sinistra
  shouldShowLeftEllipsis(): boolean {
    if (this.totalPages <= 4) return false;
    const visiblePages = this.getVisiblePages();
    return visiblePages.length > 0 && visiblePages[0] > 2;
  }

  // Mostra ellipsis a destra
  shouldShowRightEllipsis(): boolean {
    if (this.totalPages <= 4) return false;
    const visiblePages = this.getVisiblePages();
    return visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < this.totalPages - 1;
  }
}