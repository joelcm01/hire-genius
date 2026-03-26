import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Briefcase,
  RefreshCw,
  Plus,
  Clock,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow, format } from 'date-fns'
import { getCandidates } from '../api/candidates'
import { getVacancies } from '../api/vacancies'
import { getSyncStatus, triggerSync } from '../api/gdrive'
import { StatusBadge } from '../components/ui/Badge'

const StatCard: React.FC<{
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  sub?: string
}> = ({ label, value, icon, color, sub }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
    </div>
  </div>
)

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: candidatesData, isLoading: loadingCandidates } = useQuery({
    queryKey: ['candidates', { page: 1, page_size: 5 }],
    queryFn: () => getCandidates({ page: 1, page_size: 5 }).then((r) => r.data),
  })

  const { data: allCandidatesData } = useQuery({
    queryKey: ['candidates-count'],
    queryFn: () => getCandidates({ page: 1, page_size: 1 }).then((r) => r.data),
  })

  const { data: vacancies, isLoading: loadingVacancies } = useQuery({
    queryKey: ['vacancies'],
    queryFn: () => getVacancies().then((r) => r.data),
  })

  const { data: syncStatus } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => getSyncStatus().then((r) => r.data),
    refetchInterval: 30_000,
  })

  const syncMutation = useMutation({
    mutationFn: () => triggerSync().then((r) => r.data),
    onSuccess: () => {
      toast.success('Drive sync completed!')
      queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidates-count'] })
    },
    onError: () => {
      toast.error('Sync failed. Please check your Google Drive configuration.')
    },
  })

  const recentCandidates = candidatesData?.items ?? []
  const totalCandidates = allCandidatesData?.total ?? 0
  const activeVacancies = vacancies?.filter((v) => v.is_active) ?? []

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="btn-secondary text-sm"
          >
            <RefreshCw
              size={15}
              className={syncMutation.isPending ? 'animate-spin' : ''}
            />
            {syncMutation.isPending ? 'Syncing…' : 'Sync Drive'}
          </button>
          <button
            onClick={() => navigate('/vacancies/new')}
            className="btn-primary text-sm"
          >
            <Plus size={15} />
            New Vacancy
          </button>
        </div>
      </div>

      {/* Sync status card */}
      <div
        className={`card p-4 border-l-4 ${
          (syncStatus?.errors_count ?? 0) > 0
            ? 'border-l-yellow-500'
            : 'border-l-green-500'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {(syncStatus?.errors_count ?? 0) > 0 ? (
              <AlertTriangle size={20} className="text-yellow-500 shrink-0" />
            ) : (
              <CheckCircle size={20} className="text-green-500 shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Google Drive Sync
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Last sync:{' '}
                {syncStatus?.last_sync
                  ? formatDistanceToNow(new Date(syncStatus.last_sync), {
                      addSuffix: true,
                    })
                  : 'Never'}{' '}
                &middot; {syncStatus?.files_processed ?? 0} files processed
                {(syncStatus?.errors_count ?? 0) > 0 && (
                  <span className="text-yellow-600 ml-1">
                    &middot; {syncStatus?.errors_count} errors
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {syncStatus?.files_new ?? 0} new
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {syncStatus?.files_updated ?? 0} updated
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {syncStatus?.duration_seconds?.toFixed(1) ?? '0'}s
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Candidates"
          value={totalCandidates}
          icon={<Users size={20} className="text-blue-600" />}
          color="bg-blue-50"
          sub="All imported from Drive"
        />
        <StatCard
          label="Active Vacancies"
          value={activeVacancies.length}
          icon={<Briefcase size={20} className="text-indigo-600" />}
          color="bg-indigo-50"
          sub={`${(vacancies?.length ?? 0) - activeVacancies.length} closed`}
        />
        <StatCard
          label="Files Processed"
          value={syncStatus?.files_processed ?? 0}
          icon={<FileCheck size={20} className="text-emerald-600" />}
          color="bg-emerald-50"
          sub="In last sync"
        />
      </div>

      {/* Two-column bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent candidates */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Candidates</h2>
            <button
              onClick={() => navigate('/candidates')}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>
          {loadingCandidates ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Loading…
            </div>
          ) : recentCandidates.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No candidates yet. Try syncing Google Drive.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentCandidates.map((c) => (
                <li
                  key={c.candidate_id}
                  onClick={() => navigate(`/candidates/${c.candidate_id}`)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {c.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.latest_status && (
                      <StatusBadge status={c.latest_status.status} />
                    )}
                    <ArrowRight
                      size={14}
                      className="text-gray-300 group-hover:text-gray-500 transition-colors"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active vacancies */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Active Vacancies</h2>
            <button
              onClick={() => navigate('/vacancies')}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>
          {loadingVacancies ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Loading…
            </div>
          ) : activeVacancies.length === 0 ? (
            <div className="p-8 text-center">
              <TrendingUp size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No active vacancies yet.</p>
              <button
                onClick={() => navigate('/vacancies/new')}
                className="mt-3 btn-primary text-xs"
              >
                <Plus size={13} />
                Create Vacancy
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {activeVacancies.slice(0, 5).map((v) => (
                <li
                  key={v.vacancy_id}
                  onClick={() => navigate(`/vacancies/${v.vacancy_id}`)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {v.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {v.department} &middot; {v.open_positions} open{' '}
                      {v.open_positions === 1 ? 'position' : 'positions'}
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
