import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { ProjectService } from '../../_services/project/project-service';
import { Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
  standalone: true,
  imports: [CommonModule, RouterModule]
})

export class TopbarComponent implements OnInit, OnDestroy {

  // ------------------------------
  // FILTRI
  // ------------------------------

  tipo: string = '';
  stato: string = '';
  priorita: string = '';
  searchTerm: string = '';

  // Opzioni mock (puoi popolarle da API)
  tipi: string[] = ['Bug', 'Feature', 'Task'];
  stati: string[] = ['Todo', 'In Progress', 'Done'];
  prioritaListe: string[] = ['Alta', 'Media', 'Bassa'];

  // ------------------------------
  // OUTPUT VERSO IL COMPONENTE PADRE
  // ------------------------------

  @Output() filterChange = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>();

  todoPercentage: number | undefined;
  inProgressPercentage: number | undefined;
  donePercentage: number | undefined;

  // ------------------------------
  // COSTRUTTORE
  // ------------------------------

  currentRoute: string = '';
  selectedProject: string | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly projectService: ProjectService
  ) {}

  // ------------------------------
  // EVENT HANDLERS
  // ------------------------------

  navigateToNewIssuePage(): void {
    // TODO: Implementa la logica di navigazione alla pagina di creazione di una nuova issue
  }

  onFilterChange(): void {
    this.filterChange.emit({
      tipo: this.tipo,
      stato: this.stato,
      priorita: this.priorita
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.searchChange.emit(this.searchTerm);
  }

  ngOnInit(): void {
    this.todoPercentage = this.calcultateTodo();
    this.inProgressPercentage = this.calcultateProgress();
    this.donePercentage = this.calcultateDone();

    // Ascolta i cambiamenti di route
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });

    // Ascolta i cambiamenti del progetto selezionato
    this.projectService.selectedProject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(project => {
        this.selectedProject = project;
      });

    // Inizializza con la route corrente
    this.currentRoute = this.router.url;

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isDashboard(): boolean {
    return this.currentRoute === '/dashboard' || this.currentRoute.startsWith('/dashboard');
  }

  isProject(): boolean {
    return this.currentRoute.includes('/progetto');
  }

  calcultateTodo(): number {
    return 90;
  }

  calcultateProgress(): number {
    return 5;
  }

  calcultateDone(): number {
    return 5;
  }

}
