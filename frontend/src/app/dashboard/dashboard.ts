import { Component, inject, OnInit } from '@angular/core';
import { TopbarComponent } from "../_internalComponents/topbar/topbar";
import { IssuesListComponent } from "../_internalComponents/issues-list/issues-list";
import { Issue } from '../_internalComponents/issue-card/issue-card';
import { IssueService } from '../_services/issue/issue.service';

@Component({
  selector: 'app-dashboard',
  imports: [TopbarComponent, IssuesListComponent],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {

  issues: Issue[] = [
    {
      id: 1,
      title: 'Fix login validation',
      description: 'Login form needs email validation',
      tags: ['Bug', 'Todo', 'High'],
      commentsCount: 3,
      assignee: 'John Doe'
    },
    {
      id: 2,
      title: 'Update dashboard layout',
      description: 'Redesign dashboard grid system',
      tags: ['Feature', 'In Progress', 'Medium'],
      commentsCount: 5,
      assignee: 'Jane Smith'
    },
    {
      id: 3,
      title: 'Optimize database queries',
      description: 'Reduce N+1 query problems',
      tags: ['Performance', 'Todo', 'High'],
      commentsCount: 2,
      assignee: 'Bob Johnson'
    },
    {
      id: 4,
      title: 'Add dark mode support',
      description: 'Implement theme switching',
      tags: ['Feature', 'Todo', 'Low'],
      commentsCount: 7,
      assignee: 'Alice Williams'
    },
    {
      id: 5,
      title: 'Fix responsive design',
      description: 'Mobile layout broken on Safari',
      tags: ['Bug', 'In Progress', 'High'],
      commentsCount: 4,
      assignee: 'John Doe'
    },
    {
      id: 6,
      title: 'Setup CI/CD pipeline',
      description: 'Configure GitHub Actions',
      tags: ['DevOps', 'Todo', 'Medium'],
      commentsCount: 1,
      assignee: 'Charlie Brown'
    },
    {
      id: 7,
      title: 'Write unit tests',
      description: 'Add tests for service layer',
      tags: ['Testing', 'Todo', 'Medium'],
      commentsCount: 0,
      assignee: 'Diana Prince'
    },
    {
      id: 8,
      title: 'Update documentation',
      description: 'API docs need revision',
      tags: ['Documentation', 'Todo', 'Low'],
      commentsCount: 2,
      assignee: 'Eve Davis'
    },
    {
      id: 9,
      title: 'Implement search feature',
      description: 'Global search across issues',
      tags: ['Feature', 'In Progress', 'High'],
      commentsCount: 8,
      assignee: 'Frank Miller'
    },
    {
      id: 10,
      title: 'Fix memory leak',
      description: 'Component not unsubscribing',
      tags: ['Bug', 'Done', 'High'],
      commentsCount: 3,
      assignee: 'Grace Lee'
    },
    {
      id: 11,
      title: 'Add file upload',
      description: 'Support multiple file types',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 6,
      assignee: 'Henry Wilson'
    },
    {
      id: 12,
      title: 'Refactor auth module',
      description: 'Clean up authentication code',
      tags: ['Refactor', 'In Progress', 'Medium'],
      commentsCount: 4,
      assignee: 'Ivy Martin'
    },
    {
      id: 13,
      title: 'Add notifications',
      description: 'Real-time notification system',
      tags: ['Feature', 'Todo', 'High'],
      commentsCount: 5,
      assignee: 'Jack Turner'
    },
    {
      id: 14,
      title: 'Fix typos in UI',
      description: 'Multiple spelling mistakes',
      tags: ['Bug', 'Todo', 'Low'],
      commentsCount: 1,
      assignee: 'Kate Anderson'
    },
    {
      id: 15,
      title: 'Implement caching',
      description: 'Add Redis caching layer',
      tags: ['Performance', 'Todo', 'High'],
      commentsCount: 7,
      assignee: 'Liam Thomas'
    },
    {
      id: 16,
      title: 'Update dependencies',
      description: 'Security patch updates',
      tags: ['Maintenance', 'Done', 'High'],
      commentsCount: 2,
      assignee: 'Mia Jackson'
    },
    {
      id: 17,
      title: 'Add export to PDF',
      description: 'Export issues as PDF',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 3,
      assignee: 'Nathan White'
    },
    {
      id: 18,
      title: 'Fix sorting issue',
      description: 'Issues list not sorting correctly',
      tags: ['Bug', 'In Progress', 'Medium'],
      commentsCount: 4,
      assignee: 'Olivia Harris'
    },
    {
      id: 19,
      title: 'Add user roles',
      description: 'Implement role-based access',
      tags: ['Feature', 'Todo', 'High'],
      commentsCount: 8,
      assignee: 'Peter Clark'
    },
    {
      id: 20,
      title: 'Improve performance',
      description: 'Optimize bundle size',
      tags: ['Performance', 'Todo', 'Medium'],
      commentsCount: 5,
      assignee: 'Quinn Lewis'
    },
    {
      id: 21,
      title: 'Add email notifications',
      description: 'Send email on issue updates',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 3,
      assignee: 'Rachel Walker'
    },
    {
      id: 22,
      title: 'Fix dropdown menu',
      description: 'Dropdown closes on click',
      tags: ['Bug', 'Done', 'Medium'],
      commentsCount: 2,
      assignee: 'Samuel Hall'
    },
    {
      id: 23,
      title: 'Add API versioning',
      description: 'Support multiple API versions',
      tags: ['Feature', 'Todo', 'Low'],
      commentsCount: 4,
      assignee: 'Tara Allen'
    },
    {
      id: 24,
      title: 'Implement backup system',
      description: 'Daily automated backups',
      tags: ['DevOps', 'In Progress', 'High'],
      commentsCount: 6,
      assignee: 'Ulysses Young'
    },
    {
      id: 25,
      title: 'Fix console warnings',
      description: 'Remove deprecated warnings',
      tags: ['Bug', 'Todo', 'Low'],
      commentsCount: 1,
      assignee: 'Violet King'
    },
    {
      id: 26,
      title: 'Add batch operations',
      description: 'Bulk edit/delete issues',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 5,
      assignee: 'William Scott'
    },
    {
      id: 27,
      title: 'Improve error handling',
      description: 'Better error messages',
      tags: ['Refactor', 'In Progress', 'Medium'],
      commentsCount: 3,
      assignee: 'Xander Green'
    },
    {
      id: 28,
      title: 'Add data validation',
      description: 'Validate all user inputs',
      tags: ['Feature', 'Todo', 'High'],
      commentsCount: 7,
      assignee: 'Yara Adams'
    },
    {
      id: 29,
      title: 'Fix image upload',
      description: 'Images not displaying',
      tags: ['Bug', 'Done', 'High'],
      commentsCount: 4,
      assignee: 'Zachary Nelson'
    },
    {
      id: 30,
      title: 'Add audit logs',
      description: 'Track all user actions',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 2,
      assignee: 'Amelia Carter'
    },
    {
      id: 31,
      title: 'Optimize images',
      description: 'Reduce image file sizes',
      tags: ['Performance', 'Todo', 'Low'],
      commentsCount: 3,
      assignee: 'Benjamin Roberts'
    },
    {
      id: 32,
      title: 'Fix pagination',
      description: 'Pagination not working',
      tags: ['Bug', 'In Progress', 'High'],
      commentsCount: 5,
      assignee: 'Charlotte Phillips'
    },
    {
      id: 33,
      title: 'Add webhooks',
      description: 'Support webhook integrations',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 4,
      assignee: 'Daniel Campbell'
    },
    {
      id: 34,
      title: 'Refactor CSS',
      description: 'Reorganize stylesheets',
      tags: ['Refactor', 'Todo', 'Low'],
      commentsCount: 2,
      assignee: 'Eleanor Parker'
    },
    {
      id: 35,
      title: 'Add analytics',
      description: 'Track user analytics',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 6,
      assignee: 'Ethan Evans'
    },
    {
      id: 36,
      title: 'Fix form validation',
      description: 'Form not validating input',
      tags: ['Bug', 'Done', 'Medium'],
      commentsCount: 3,
      assignee: 'Fiona Edwards'
    },
    {
      id: 37,
      title: 'Add search filters',
      description: 'Advanced search options',
      tags: ['Feature', 'In Progress', 'Medium'],
      commentsCount: 5,
      assignee: 'Gregory Collins'
    },
    {
      id: 38,
      title: 'Optimize queries',
      description: 'Speed up database queries',
      tags: ['Performance', 'Todo', 'High'],
      commentsCount: 4,
      assignee: 'Hannah Stewart'
    },
    {
      id: 39,
      title: 'Add user profiles',
      description: 'User profile management',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 7,
      assignee: 'Isaac Sanchez'
    },
    {
      id: 40,
      title: 'Fix API timeout',
      description: 'API calls timing out',
      tags: ['Bug', 'In Progress', 'High'],
      commentsCount: 5,
      assignee: 'Julia Morris'
    },
    {
      id: 41,
      title: 'Add multilingual support',
      description: 'Support multiple languages',
      tags: ['Feature', 'Todo', 'Low'],
      commentsCount: 8,
      assignee: 'Kevin Rogers'
    },
    {
      id: 42,
      title: 'Fix CSS alignment',
      description: 'UI elements misaligned',
      tags: ['Bug', 'Done', 'Low'],
      commentsCount: 2,
      assignee: 'Laura Morgan'
    },
    {
      id: 43,
      title: 'Add import functionality',
      description: 'Import data from CSV',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 4,
      assignee: 'Marcus Peterson'
    },
    {
      id: 44,
      title: 'Improve security',
      description: 'Add CSRF protection',
      tags: ['Security', 'Todo', 'High'],
      commentsCount: 6,
      assignee: 'Natasha Powell'
    },
    {
      id: 45,
      title: 'Add undo functionality',
      description: 'Undo recent changes',
      tags: ['Feature', 'Todo', 'Low'],
      commentsCount: 3,
      assignee: 'Oscar Long'
    },
    {
      id: 46,
      title: 'Fix redirect loop',
      description: 'Authentication redirect issue',
      tags: ['Bug', 'In Progress', 'High'],
      commentsCount: 5,
      assignee: 'Patricia Patterson'
    },
    {
      id: 47,
      title: 'Add scheduled tasks',
      description: 'Task scheduler implementation',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 4,
      assignee: 'Quentin Hughes'
    },
    {
      id: 48,
      title: 'Improve accessibility',
      description: 'Add ARIA labels',
      tags: ['Feature', 'Todo', 'Medium'],
      commentsCount: 7,
      assignee: 'Rebecca Burns'
    },
    {
      id: 49,
      title: 'Fix data sync',
      description: 'Real-time data synchronization',
      tags: ['Bug', 'Done', 'High'],
      commentsCount: 5,
      assignee: 'Steven Chambers'
    },
    {
      id: 50,
      title: 'Add comment reactions',
      description: 'Emoji reactions on comments',
      tags: ['Feature', 'Todo', 'Low'],
      commentsCount: 9,
      assignee: 'Tessa Cox'
    }
  ];
  searchTerm: string = '';
  tipoFilter: string = '';
  statoFilter: string = '';
  prioritaFilter: string = '';

  todoPercentage: number = 0;
  inProgressPercentage: number = 0;
  donePercentage: number = 0;

  private issueService = inject(IssueService);

  ngOnInit(): void {
    this.loadAllIssues();
  }

  loadAllIssues(): void {
    this.issueService.getAllIssues().subscribe({
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