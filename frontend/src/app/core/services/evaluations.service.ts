import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Evaluation, CreateEvaluationDto } from '../models/evaluation.model';

export interface EvaluationsResponse {
  evaluations: Evaluation[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class EvaluationsService extends ApiService {

  getVacancyRanking(vacancyId: string): Observable<EvaluationsResponse> {
    return this.get<EvaluationsResponse>(`/evaluations`, { vacancyId });
  }

  createEvaluation(data: CreateEvaluationDto): Observable<Evaluation> {
    return this.post<Evaluation>('/evaluations', data);
  }

  getEvaluation(id: string): Observable<Evaluation> {
    return this.get<Evaluation>(`/evaluations/${id}`);
  }
}
