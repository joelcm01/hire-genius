import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportsService extends ApiService {

  downloadReport(vacancyId: string, candidateIds: string[]): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/reports/generate`,
      { vacancyId, candidateIds },
      { responseType: 'blob' }
    );
  }

  generateRankingReport(vacancyId: string): Observable<Blob> {
    return this.getBlob(`/reports/ranking/${vacancyId}`);
  }
}
