import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityItem } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private apiUrl = `${environment.apiUrl}/activities`;

  constructor(private http: HttpClient) { }

  getRecentActivities(limit: number = 18): Observable<ActivityItem[]> {
    console.log(limit);
    return this.http.get<ActivityItem[]>(`${this.apiUrl}/recent?limit=${limit}`).pipe(
      catchError(err => {
        console.error('[ActivityService] getRecentActivities failed', err);
        return of([]);
      })
    );
  }
}
