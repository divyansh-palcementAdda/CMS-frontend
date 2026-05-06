import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LocationDTO {
  state: string;
  city: string;
}

export interface BulkUploadResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  createdCount?: number;
  updatedCount?: number;
  skippedCount?: number;
  successes: any[];
  failures: { rowNumber: number; errorMessage: string }[];
  errorFileId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = `${environment.apiUrl}/location`;

  constructor(private http: HttpClient) {}

  getAllStates(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/states`);
  }

  getCitiesByState(state: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/cities`, { params: { state } });
  }

  getLocationByCity(city: string): Observable<LocationDTO> {
    return this.http.get<LocationDTO>(`${this.apiUrl}/by-city/${city}`);
  }

  addLocation(dto: LocationDTO): Observable<LocationDTO> {
    return this.http.post<LocationDTO>(this.apiUrl, dto);
  }

  bulkUpload(file: File): Observable<BulkUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BulkUploadResult>(`${this.apiUrl}/bulk-upload`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-template`, { responseType: 'blob' });
  }
}
