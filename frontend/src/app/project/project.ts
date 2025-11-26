import { Component } from '@angular/core';
import { TopbarComponent } from "../_internalComponents/topbar/topbar";
import { IssuesListComponent } from "../_internalComponents/issues-list/issues-list";
import { Issue } from '../_internalComponents/issue-card/issue-card';

@Component({
  selector: 'app-project',
  imports: [TopbarComponent, IssuesListComponent],
  templateUrl: './project.html',
  styleUrl: './project.css',
})

export class ProjectComponent {

  issues: Issue[] = [
      {
        id: 1,
        title: 'Issue Title',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis eu magna sed neque ultrices gravida. Nullam tristique quam vitae elementum scelerisque. Nam ut lacinia dolor. Sed mattis lacus dolor, tristique convallis eros posuere nec. Aenean sit amet nulla ante. Sed luctus augue vel ultricies tincidunt. Suspendisse luctus dignissim lorem et elementum. Donec maximus nisi aliquam magna eleifend, eu eleifend nisi iaculis. Aliquam tempor consequat neque, in commodo sem dapibus et. Morbi molestie, dui eu cursus aliquet, ligula dui tempus orci, in sagittis dolor diam nec magna. Ut lacinia erat non ipsum varius vestibulum. Vestibulum tempus elit vulputate volutpat placerat. Pellentesque viverra, est eu posuere viverra, urna purus placerat felis, sit amet finibus ex orci sed turpis. Nam ligula neque, porttitor a sem quis, iaculis euismod est. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        tags: ['one', 'two', 'three'],
        commentsCount: 6,
        assignee: 'Diego Gomez'
      },
      {
        id: 1,
        title: 'Issue Title',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis eu magna sed neque ultrices gravida. Nullam tristique quam vitae elementum scelerisque. Nam ut lacinia dolor. Sed mattis lacus dolor, tristique convallis eros posuere nec. Aenean sit amet nulla ante. Sed luctus augue vel ultricies tincidunt. Suspendisse luctus dignissim lorem et elementum. Donec maximus nisi aliquam magna eleifend, eu eleifend nisi iaculis. Aliquam tempor consequat neque, in commodo sem dapibus et. Morbi molestie, dui eu cursus aliquet, ligula dui tempus orci, in sagittis dolor diam nec magna. Ut lacinia erat non ipsum varius vestibulum. Vestibulum tempus elit vulputate volutpat placerat. Pellentesque viverra, est eu posuere viverra, urna purus placerat felis, sit amet finibus ex orci sed turpis. Nam ligula neque, porttitor a sem quis, iaculis euismod est. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        tags: ['one', 'two', 'three'],
        commentsCount: 6,
        assignee: 'Diego Gomez'
      },
      {
        id: 1,
        title: 'Issue Title',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis eu magna sed neque ultrices gravida. Nullam tristique quam vitae elementum scelerisque. Nam ut lacinia dolor. Sed mattis lacus dolor, tristique convallis eros posuere nec. Aenean sit amet nulla ante. Sed luctus augue vel ultricies tincidunt. Suspendisse luctus dignissim lorem et elementum. Donec maximus nisi aliquam magna eleifend, eu eleifend nisi iaculis. Aliquam tempor consequat neque, in commodo sem dapibus et. Morbi molestie, dui eu cursus aliquet, ligula dui tempus orci, in sagittis dolor diam nec magna. Ut lacinia erat non ipsum varius vestibulum. Vestibulum tempus elit vulputate volutpat placerat. Pellentesque viverra, est eu posuere viverra, urna purus placerat felis, sit amet finibus ex orci sed turpis. Nam ligula neque, porttitor a sem quis, iaculis euismod est. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        tags: ['one', 'two', 'three'],
        commentsCount: 6,
        assignee: 'Diego Gomez'
      }

    ];

}
