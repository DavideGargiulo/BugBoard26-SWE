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

  issues: Issue[] = [
      // {
      //   id: 1,
      //   title: 'Issue Title',
      //   description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis eu magna sed neque ultrices gravida. Nullam tristique quam vitae elementum scelerisque. Nam ut lacinia dolor. Sed mattis lacus dolor, tristique convallis eros posuere nec. Aenean sit amet nulla ante. Sed luctus augue vel ultricies tincidunt. Suspendisse luctus dignissim lorem et elementum. Donec maximus nisi aliquam magna eleifend, eu eleifend nisi iaculis. Aliquam tempor consequat neque, in commodo sem dapibus et. Morbi molestie, dui eu cursus aliquet, ligula dui tempus orci, in sagittis dolor diam nec magna. Ut lacinia erat non ipsum varius vestibulum. Vestibulum tempus elit vulputate volutpat placerat. Pellentesque viverra, est eu posuere viverra, urna purus placerat felis, sit amet finibus ex orci sed turpis. Nam ligula neque, porttitor a sem quis, iaculis euismod est. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
      //   tags: ['one', 'two', 'three'],
      //   commentsCount: 6,
      //   assignee: 'Diego Gomez'
      // },
      // {
      //   id: 1,
      //   title: 'Issue Title',
      //   description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis eu magna sed neque ultrices gravida. Nullam tristique quam vitae elementum scelerisque. Nam ut lacinia dolor. Sed mattis lacus dolor, tristique convallis eros posuere nec. Aenean sit amet nulla ante. Sed luctus augue vel ultricies tincidunt. Suspendisse luctus dignissim lorem et elementum. Donec maximus nisi aliquam magna eleifend, eu eleifend nisi iaculis. Aliquam tempor consequat neque, in commodo sem dapibus et. Morbi molestie, dui eu cursus aliquet, ligula dui tempus orci, in sagittis dolor diam nec magna. Ut lacinia erat non ipsum varius vestibulum. Vestibulum tempus elit vulputate volutpat placerat. Pellentesque viverra, est eu posuere viverra, urna purus placerat felis, sit amet finibus ex orci sed turpis. Nam ligula neque, porttitor a sem quis, iaculis euismod est. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
      //   tags: ['one', 'two', 'three'],
      //   commentsCount: 6,
      //   assignee: 'Diego Gomez'
      // },
      // {
      //   id: 1,
      //   title: 'Issue Title',
      //   description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis eu magna sed neque ultrices gravida. Nullam tristique quam vitae elementum scelerisque. Nam ut lacinia dolor. Sed mattis lacus dolor, tristique convallis eros posuere nec. Aenean sit amet nulla ante. Sed luctus augue vel ultricies tincidunt. Suspendisse luctus dignissim lorem et elementum. Donec maximus nisi aliquam magna eleifend, eu eleifend nisi iaculis. Aliquam tempor consequat neque, in commodo sem dapibus et. Morbi molestie, dui eu cursus aliquet, ligula dui tempus orci, in sagittis dolor diam nec magna. Ut lacinia erat non ipsum varius vestibulum. Vestibulum tempus elit vulputate volutpat placerat. Pellentesque viverra, est eu posuere viverra, urna purus placerat felis, sit amet finibus ex orci sed turpis. Nam ligula neque, porttitor a sem quis, iaculis euismod est. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
      //   tags: ['one', 'two', 'three'],
      //   commentsCount: 6,
      //   assignee: 'Diego Gomez'
      // }

    ];

  projectName: string = '';

  constructor(private route: ActivatedRoute) {}

  private issueService = inject(IssueService);

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
          tags: [backendIssue.tipo, backendIssue.priorita, backendIssue.stato],
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

}