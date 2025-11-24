// src/app/services/project.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export let project: string;

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private selectedProjectSubject = new BehaviorSubject<string | null>(null);
  public selectedProject$: Observable<string | null> = this.selectedProjectSubject.asObservable();

  setSelectedProject(project: string | null): void {
    this.selectedProjectSubject.next(project);
  }

  getSelectedProject(): string | null {
    return this.selectedProjectSubject.value;
  }
}