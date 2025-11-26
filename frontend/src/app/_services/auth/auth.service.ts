import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Assicurati che questa URL corrisponda al tuo backend
  private apiUrl = 'http://localhost:3000/api/auth';

  private userProfileSubject = new BehaviorSubject<any | null>(null);
  public currentUser$ = this.userProfileSubject.asObservable();

  constructor() {
    // Al caricamento, controlliamo se c'è una sessione attiva (cookie)
    this.checkSession().subscribe();
  }

  /**
   * Login tramite Backend (BFF Pattern)
   */
  login(email: string, password: string, rememberMe: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password, rememberMe }, { withCredentials: true }).pipe(
      tap(() => {
        this.checkSession().subscribe();
      })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe(() => {
      this.userProfileSubject.next(null);
      this.router.navigate(['/login']);
    });
  }

  checkSession(): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      map(response => {
        if (response.authenticated) {
          this.userProfileSubject.next(response.user);
          return true;
        }
        return false;
      }),
      catchError(() => {
        this.userProfileSubject.next(null);
        return of(false);
      })
    );
  }

  isAuthenticated(): Observable<boolean> {
    if (this.userProfileSubject.value) {
      return of(true);
    }
    return this.checkSession();
  }

  hasRole(role: string): boolean {
    const profile = this.userProfileSubject.value;
    if (!profile || !profile.realm_access || !profile.realm_access.roles) {
      return false;
    }
    return profile.realm_access.roles.includes(role);
  }
}