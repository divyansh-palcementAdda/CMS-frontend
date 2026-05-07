import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LeadSourceDTO } from '../models/lead-source.model';


@Injectable({
  providedIn: 'root'
})
export class LeadSourceService {
  private apiUrl = `${environment.apiUrl}/lead-sources`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getActive(): Observable<any> {
    return this.http.get(`${this.apiUrl}/active`);
  }

  getById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  create(leadSource: LeadSourceDTO): Observable<any> {
    return this.http.post(this.apiUrl, leadSource);
  }

  update(id: string, leadSource: LeadSourceDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, leadSource);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
