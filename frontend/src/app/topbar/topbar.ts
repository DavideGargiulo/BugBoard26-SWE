import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
  styleUrls: ['./topbar.css'] // opzionale se usi Tailwind
})
export class TopbarComponent implements OnInit {

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
  // EVENT HANDLERS
  // ------------------------------

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
