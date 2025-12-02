import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

const LOCAL = false; // Imposta a true per bypassare l'autenticazione in locale
const ISAUTH = false; // Imposta a true per simulare utente autenticato in locale

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Assicurati che questa URL corrisponda al tuo backend
  private readonly apiUrl = 'http://localhost:3000/api/auth';

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

    if (LOCAL){
      return of(ISAUTH);
    }else{
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

  }

  isAuthenticated(): Observable<boolean> {

    if (LOCAL){
      return of(ISAUTH);
    }else{
      if (this.userProfileSubject.value) {
        return of(true);
      }
      return this.checkSession();
    }

  }

  hasRole(role: string): boolean {
    const profile = this.userProfileSubject.value;
    if (!profile || !profile.realm_access || !profile.realm_access.roles) {
      return false;
    }
    return profile.realm_access.roles.includes(role);
  }

  register(userData: { nome: string; cognome: string; email: string; ruolo: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData, {
      withCredentials: true
    });
  }
}