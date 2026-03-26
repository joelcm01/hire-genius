import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { Loader2 } from 'lucide-react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const VacanciesList = lazy(() => import('./pages/VacanciesList'))
const CreateVacancy = lazy(() => import('./pages/CreateVacancy'))
const VacancyDetail = lazy(() => import('./pages/VacancyDetail'))
const CandidatesList = lazy(() => import('./pages/CandidatesList'))
const CandidateDetail = lazy(() => import('./pages/CandidateDetail'))
const GoogleDriveConfig = lazy(() => import('./pages/GoogleDriveConfig'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full min-h-[50vh]">
    <Loader2 size={32} className="animate-spin text-primary-500" />
  </div>
)

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vacancies" element={<VacanciesList />} />
          <Route path="/vacancies/new" element={<CreateVacancy />} />
          <Route path="/vacancies/:id" element={<VacancyDetail />} />
          <Route path="/candidates" element={<CandidatesList />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/gdrive-config" element={<GoogleDriveConfig />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
