import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  // Mantiene lo stato dell'utente in memoria
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isSessionChecked = false;

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((response: any) => {
        this.currentUserSubject.next(response.user || { email: credentials.email, password: credentials.password });
        this.isSessionChecked = true;
      })
    );
  }

  // Ritorna true se l'utente è autenticato, false altrimenti
  isAuthenticated(): Observable<boolean> {
    if (this.currentUserSubject.value) {
      return of(true);
    }

    return this.http.get(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      map((user: any) => {
        this.currentUserSubject.next(user);
        this.isSessionChecked = true;
        return true;
      }),
      catchError(() => {
        this.currentUserSubject.next(null);
        this.isSessionChecked = true;
        return of(false);
      })
    );
  }

  // --- LOGOUT ---
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe(() => {
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    });
  }
}