// project-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly apiUrl = 'http://localhost:3000/api';

  private selectedProjectSubject = new BehaviorSubject<string | null>(null);
  public readonly selectedProject$: Observable<string | null> = this.selectedProjectSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  setSelectedProject(project: string | null): void {
    this.selectedProjectSubject.next(project);
  }

  getSelectedProject(): string | null {
    return this.selectedProjectSubject.value;
  }

  createProject(projectData: { nome: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/projects`, projectData, { withCredentials: true });
  }

  getAllProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/projects`);
  }
}