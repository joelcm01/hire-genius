import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Candidate, CandidateListParams, CandidateStatusEnum } from '../models/candidate.model';

export interface CandidatesResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CvUrlResponse {
  url: string;
}

@Injectable({ providedIn: 'root' })
export class CandidatesService extends ApiService {

  getCandidates(params?: CandidateListParams): Observable<CandidatesResponse> {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.search) queryParams['search'] = params.search;
    if (params?.status) queryParams['status'] = params.status;
    if (params?.page !== undefined) queryParams['page'] = params.page;
    if (params?.pageSize !== undefined) queryParams['pageSize'] = params.pageSize;
    return this.get<CandidatesResponse>('/candidates', queryParams);
  }

  getCandidate(id: string): Observable<Candidate> {
    return this.get<Candidate>(`/candidates/${id}`);
  }

  updateStatus(id: string, status: CandidateStatusEnum, vacancyId?: string): Observable<Candidate> {
    return this.patch<Candidate>(`/candidates/${id}/status`, { status, vacancyId });
  }

  getCvUrl(id: string): Observable<CvUrlResponse> {
    return this.get<CvUrlResponse>(`/candidates/${id}/cv-url`);
  }
}
