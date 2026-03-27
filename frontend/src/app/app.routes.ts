import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'vacancies',
        loadComponent: () =>
          import('./features/vacancies/vacancies-list/vacancies-list.component').then(
            m => m.VacanciesListComponent
          ),
      },
      {
        path: 'vacancies/new',
        loadComponent: () =>
          import('./features/vacancies/vacancy-form/vacancy-form.component').then(
            m => m.VacancyFormComponent
          ),
      },
      {
        path: 'vacancies/:id',
        loadComponent: () =>
          import('./features/vacancies/vacancy-detail/vacancy-detail.component').then(
            m => m.VacancyDetailComponent
          ),
      },
      {
        path: 'candidates',
        loadComponent: () =>
          import('./features/candidates/candidates-list/candidates-list.component').then(
            m => m.CandidatesListComponent
          ),
      },
      {
        path: 'candidates/:id',
        loadComponent: () =>
          import('./features/candidates/candidate-detail/candidate-detail.component').then(
            m => m.CandidateDetailComponent
          ),
      },
      {
        path: 'gdrive-config',
        loadComponent: () =>
          import('./features/gdrive/gdrive-config.component').then(m => m.GDriveConfigComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(m => m.ReportsComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
