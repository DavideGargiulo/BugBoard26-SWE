import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class IssueService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/issues'; // URL del backend

  getIssuesByProject(projectName: string) {
    const url = `${this.apiUrl}/project/${projectName}`;
    console.log(url);
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  getAllIssues() {
    return this.http.get<any[]>(this.apiUrl, { withCredentials: true });
  }

}
