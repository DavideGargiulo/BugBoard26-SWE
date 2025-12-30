import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TopbarComponent } from "../_internalComponents/topbar/topbar";
import { IssuesListComponent } from "../_internalComponents/issues-list/issues-list";
import { Issue } from '../_internalComponents/issue-card/issue-card';
import { IssueService } from '../_services/issue/issue.service';
import { switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-project',
  imports: [TopbarComponent, IssuesListComponent],
  templateUrl: './project.html'
})

export class ProjectComponent implements OnInit {

  issues: Issue[] = [];
  projectName: string = '';
  searchTerm: string = '';
  tipoFilter: string = '';
  statoFilter: string = '';
  prioritaFilter: string = '';

  todoPercentage: number = 0;
  inProgressPercentage: number = 0;
  donePercentage: number = 0;

  constructor(private readonly route: ActivatedRoute) {}

  private readonly issueService = inject(IssueService);

  ngOnInit(): void {
    this.route.params.pipe(
      tap(params => {
        this.projectName = params['nome'];
        console.log('Nome progetto dall\'URL:', this.projectName);
      }),
      switchMap(params => {
        const projectName = params['nome'];
        return this.issueService.getIssuesByProject(projectName);
      })
    ).subscribe({
      next: (data) => {
        console.log('Issues caricate dal backend:', data);
        this.issues = data.map(backendIssue => ({
          id: backendIssue.id,
          title: backendIssue.titolo,
          description: backendIssue.descrizione,
          tags: [backendIssue.tipo, backendIssue.stato, backendIssue.priorita],
          commentsCount: backendIssue.numeroCommenti,
          assignee: backendIssue.Creatore.nome
        }));
        console.log('Issues convertite:', this.issues);
      },
      error: (err) => {
        console.log('Errore caricamento issues:', err);
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
  }

  onTipoFilterChange(tipo: string): void {
    this.tipoFilter = tipo;
  }

  onStatoFilterChange(stato: string): void {
    this.statoFilter = stato;
  }

  onPrioritaFilterChange(priorita: string): void {
    this.prioritaFilter = priorita;
  }

  onStatisticsChange(stats: {todo: number, inProgress: number, done: number}): void {
    this.todoPercentage = stats.todo;
    this.inProgressPercentage = stats.inProgress;
    this.donePercentage = stats.done;
  }
}