import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface User {
  name: string;
  role: string;
}

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-card.html'
})

export class UserCardComponent {
  @Input() user!: User;

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }
}