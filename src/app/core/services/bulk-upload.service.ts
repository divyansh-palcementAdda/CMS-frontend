import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BulkUploadService {
  private apiUrl = `${environment.apiUrl}/bulk-upload`;

  constructor(private http: HttpClient) { }

  downloadErrorFile(errorFileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/errors/${errorFileId}`, { responseType: 'blob' });
  }
}
