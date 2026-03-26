import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Briefcase,
  ChevronRight,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { getVacancies } from '../api/vacancies'
import { Badge } from '../components/ui/Badge'

const VacanciesList: React.FC = () => {
  const navigate = useNavigate()

  const { data: vacancies, isLoading, error } = useQuery({
    queryKey: ['vacancies'],
    queryFn: () => getVacancies().then((r) => r.data),
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vacancies</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage open positions and view candidate rankings
          </p>
        </div>
        <button
          onClick={() => navigate('/vacancies/new')}
          className="btn-primary"
        >
          <Plus size={16} />
          New Vacancy
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card p-12 text-center text-gray-400">
          Loading vacancies…
        </div>
      ) : error ? (
        <div className="card p-12 text-center text-red-500">
          Failed to load vacancies. Please try again.
        </div>
      ) : !vacancies?.length ? (
        <div className="card p-16 text-center">
          <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No vacancies created yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Create your first vacancy to start ranking candidates
          </p>
          <button
            onClick={() => navigate('/vacancies/new')}
            className="btn-primary"
          >
            <Plus size={15} />
            Create Vacancy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vacancies.map((v) => (
            <div
              key={v.vacancy_id}
              onClick={() => navigate(`/vacancies/${v.vacancy_id}`)}
              className="card p-5 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all group"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
                    {v.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{v.department}</p>
                </div>
                {v.is_active ? (
                  <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle size={11} />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full shrink-0">
                    <XCircle size={11} />
                    Closed
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  {v.open_positions} open{' '}
                  {v.open_positions === 1 ? 'position' : 'positions'}
                </span>
                <span>{v.required_experience_years}y exp</span>
              </div>

              {/* Requirements preview */}
              {v.requirements.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {v.requirements.slice(0, 3).map((req, i) => (
                    <Badge key={i} variant="indigo">
                      {req}
                    </Badge>
                  ))}
                  {v.requirements.length > 3 && (
                    <Badge variant="gray">+{v.requirements.length - 3}</Badge>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Created {format(new Date(v.created_at), 'MMM d, yyyy')}
                </span>
                <ChevronRight
                  size={16}
                  className="text-gray-400 group-hover:text-primary-500 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VacanciesList
