import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Vacancy, CreateVacancyDto, RankedCandidate } from '../models/vacancy.model';

export interface VacanciesResponse {
  vacancies: Vacancy[];
  total: number;
}

export interface RankingResponse {
  vacancyId: string;
  vacancyTitle: string;
  candidates: RankedCandidate[];
}

@Injectable({ providedIn: 'root' })
export class VacanciesService extends ApiService {

  getVacancies(): Observable<VacanciesResponse> {
    return this.get<VacanciesResponse>('/vacancies');
  }

  getVacancy(id: string): Observable<Vacancy> {
    return this.get<Vacancy>(`/vacancies/${id}`);
  }

  createVacancy(data: CreateVacancyDto): Observable<Vacancy> {
    return this.post<Vacancy>('/vacancies', data);
  }

  updateVacancy(id: string, data: Partial<CreateVacancyDto>): Observable<Vacancy> {
    return this.put<Vacancy>(`/vacancies/${id}`, data);
  }

  getRanking(vacancyId: string): Observable<RankingResponse> {
    return this.get<RankingResponse>(`/vacancies/${vacancyId}/ranking`);
  }
}
