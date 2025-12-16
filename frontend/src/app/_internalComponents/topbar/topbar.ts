import { Component, EventEmitter, OnDestroy, OnInit, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { ProjectService } from '../../_services/project/project-service';
import { Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})

export class TopbarComponent implements OnInit, OnDestroy {

  // ------------------------------
  // FILTRI
  // ------------------------------

  tipo: string = '';
  stato: string = '';
  priorita: string = '';
  searchTerm: string = '';

  // Opzioni
  tipi: string[] = ['Bug', 'Feature', 'Question', 'Documentation'];
  stati: string[] = ['TODO', 'In Progress', 'Done'];
  prioritaListe: string[] = ['Alta', 'Media', 'Bassa'];

  // ------------------------------
  // STATISTICHE
  // ------------------------------

  @Input() todoPercentage: number = 0;
  @Input() inProgressPercentage: number = 0;
  @Input() donePercentage: number = 0;

  // ------------------------------
  // OUTPUT VERSO IL COMPONENTE PADRE
  // ------------------------------

  @Output() tipoFilterChange = new EventEmitter<string>();
  @Output() statoFilterChange = new EventEmitter<string>();
  @Output() prioritaFilterChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();

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
    if (this.selectedProject) {
      this.router.navigate([`/progetto/${this.selectedProject}/nuova-issue`]);
    }
  }

  onTipoChange(): void {
    this.tipoFilterChange.emit(this.tipo);
  }

  onStatoChange(): void {
    this.statoFilterChange.emit(this.stato);
  }

  onPrioritaChange(): void {
    this.prioritaFilterChange.emit(this.priorita);
  }

  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm);
  }

  ngOnInit(): void {
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

  // Formatta percentuale con 1 decimale
  formatPercentage(value: number): string {
    return value.toFixed(1);
  }

  // Metodo per generare il path SVG del pie chart con percentuali precise
  getSlicePath(startPercentage: number, slicePercentage: number): string {
  if (slicePercentage === 0) return '';

  const radius = 48;
  const centerX = 48;
  const centerY = 48;

  // Usa le percentuali esatte senza arrotondamenti
  const totalPercentage = this.todoPercentage + this.inProgressPercentage + this.donePercentage;

  // Normalizza se il totale non è esattamente 100 (per errori di arrotondamento)
  const normalizedStart = totalPercentage > 0 ? (startPercentage / totalPercentage) * 100 : 0;
  const normalizedSlice = totalPercentage > 0 ? (slicePercentage / totalPercentage) * 100 : 0;

  // Se la slice è praticamente 100%, disegna un cerchio completo
  if (normalizedSlice >= 99.9) {
    return `M ${centerX} ${centerY} m -${radius}, 0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`;
  }

  // Converti percentuali in angoli (0% = -90°, inizia dall'alto)
  const startAngle = -90 + (normalizedStart / 100) * 360;
  const endAngle = startAngle + (normalizedSlice / 100) * 360;

  // Converti angoli in radianti
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calcola le coordinate dei punti
  const startX = centerX + radius * Math.cos(startRad);
  const startY = centerY + radius * Math.sin(startRad);
  const endX = centerX + radius * Math.cos(endRad);
  const endY = centerY + radius * Math.sin(endRad);

  // Determina se l'arco è maggiore di 180°
  const largeArc = normalizedSlice > 50 ? 1 : 0;

  // Crea il path SVG
  return [
    `M ${centerX} ${centerY}`,
    `L ${startX} ${startY}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
    'Z'
  ].join(' ');
}
}