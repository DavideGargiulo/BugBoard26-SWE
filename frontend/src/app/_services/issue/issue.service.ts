import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class IssueService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/issues'; // URL del backend
  private commentApiUrl = 'http://localhost:3000/api/comments'; // URL del backend

  getIssuesByProject(projectName: string) {
    const url = `${this.apiUrl}/project/${projectName}`;
    console.log(url);
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  getAllIssues() {
    return this.http.get<any[]>(this.apiUrl, { withCredentials: true });
  }

  getIssueById(issueId: number) {
    const url = `${this.apiUrl}/${issueId}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  createComment(issueId: number, commentData: any) {
    const url = `${this.commentApiUrl}`;
    const formData = new FormData();

    formData.append('testo', commentData.testo);
    formData.append('id_issue', issueId.toString());

    // IMPORTANTE: Appendi ogni file separatamente
    if (commentData.attachments && commentData.attachments.length > 0) {
      commentData.attachments.forEach((file: File) => {
        formData.append('attachments', file, file.name);
      });
    }

    // Debug per verificare cosa stai inviando
    console.log('=== FORMDATA DEBUG ===');
    console.log('Numero di file:', commentData.attachments?.length || 0);
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(key, '-> File:', value.name, value.type, value.size);
      } else {
        console.log(key, '->', value);
      }
    });

    return this.http.post<any>(url, formData, { withCredentials: true });
  }

  updateIssue(issueId: number, arg1: { descrizione: string; removedAttachments: number[]; newAttachments: File[]; }) {
    // TODO
    const url = `${this.apiUrl}/${issueId}`;
    const formData = new FormData();
    return this.http.post<any>(url, formData, { withCredentials: true });
  }

}