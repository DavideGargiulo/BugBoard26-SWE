import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private selectedProjectSubject = new BehaviorSubject<string | null>(null);
  public readonly selectedProject$: Observable<string | null> = this.selectedProjectSubject.asObservable();

  setSelectedProject(project: string | null): void {
    this.selectedProjectSubject.next(project);
  }

  getSelectedProject(): string | null {
    return this.selectedProjectSubject.value;
  }
}