import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface Issue {
  id: number;
  title: string;
  description: string;
  tags: string[];
  commentsCount: number;
  assignee: string;
}

@Component({
  selector: 'app-issue-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './issue-card.html'
})

export class IssueCardComponent {
  @Input() issue!: Issue;

  constructor(private readonly router: Router) {}

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  navigateToDetail(): void {
    this.router.navigate(['/issue', this.issue.id]);
  }
}