import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  templateUrl: './issue-card.html',
  styleUrl: './issue-card.css',
})

export class IssueCardComponent {
  @Input() issue!: Issue;

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }
}