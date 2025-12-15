import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../_services/auth/auth.service';
import { ToastService } from '../../_services/toast/toast.service';

export interface User {
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-card.html'
})

export class UserCardComponent implements OnInit {

  @Input() user!: User;
  @Input() currentUser!: User;
  @Output() deleteUser = new EventEmitter<User>();
  private userSubscription: Subscription | null = null;

  constructor(
    private readonly authService: AuthService,
    private toastService: ToastService
  ) {}

  showDeleteModal = false;

  ngOnInit(): void {

    this.userSubscription = this.authService.currentUser$.subscribe(backendUser => {
      if (backendUser) {
        this.currentUser = {
          name: backendUser.name || `${backendUser.given_name} ${backendUser.family_name}`,
          email: backendUser.email,
          role: this.extractRole(backendUser)
        };
      } else {
        this.currentUser = { name: 'Ospite', email: '', role: '' };
      }
    });

  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  canDeleteUser(): boolean {
    return this.currentUser.role === 'Amministratore' &&
           this.user.name !== this.currentUser.name;
  }

  onDelete(): void {
    this.showDeleteModal = false;
    console.log(`Emitting delete event for user: ${this.user.name}`);
    this.deleteUser.emit(this.user);
    console.log(`Utente eliminato: ${this.user.name} with role ${this.user.role} with email ${this.user.email}`);
    this.toastService.success(
          'Utente eliminato con successo!',
          `Utente ${this.user.name} eliminato.`
        );
  }

  private extractRole(user: any): string {
    const roles = user.realm_access?.roles || [];

    if (roles.includes('Amministratore')) return 'Amministratore';
    return 'Standard';
  }
}