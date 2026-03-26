import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Mail,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { getCandidates } from '../api/candidates'
import type { CandidateStatus } from '../api/types'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { format } from 'date-fns'

const STATUS_OPTIONS: { value: CandidateStatus['status'] | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'en_proceso', label: 'In Process' },
  { value: 'en_espera', label: 'On Hold' },
  { value: 'contratado', label: 'Hired' },
  { value: 'no_apto', label: 'Not Suitable' },
  { value: 'descartado', label: 'Discarded' },
]

const PAGE_SIZE = 15

const CandidatesList: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CandidateStatus['status'] | ''>('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 350)
  }, [])

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidates', { search: debouncedSearch, status: statusFilter, page, page_size: PAGE_SIZE }],
    queryFn: () =>
      getCandidates({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      }).then((r) => r.data),
  })

  const candidates = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('')
    setPage(1)
  }

  const hasFilters = !!debouncedSearch || !!statusFilter

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} candidate{total !== 1 ? 's' : ''} in the system
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`btn-secondary text-sm ${showFilters ? 'border-primary-400 text-primary-600' : ''}`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasFilters && (
            <span className="ml-1 w-2 h-2 rounded-full bg-primary-500 inline-block" />
          )}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name or email…"
              className="input pl-9"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary text-sm text-gray-500"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-1">
            <div>
              <label className="label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as CandidateStatus['status'] | '')
                  setPage(1)
                }}
                className="input w-48"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card p-12 text-center text-gray-400">
          Loading candidates…
        </div>
      ) : error ? (
        <div className="card p-12 text-center text-red-500">
          Failed to load candidates. Please try again.
        </div>
      ) : candidates.length === 0 ? (
        <div className="card p-16 text-center">
          <Users size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {hasFilters ? 'No candidates match your filters' : 'No candidates yet'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {hasFilters
              ? 'Try adjusting your search or filters'
              : 'Sync Google Drive to import CVs'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Location</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">Skills</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 hidden xl:table-cell">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {candidates.map((c) => (
                  <tr
                    key={c.candidate_id}
                    onClick={() => navigate(`/candidates/${c.candidate_id}`)}
                    className="hover:bg-gray-50/60 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {c.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                            {c.name}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail size={10} />
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {c.location ? (
                        <span className="flex items-center gap-1 text-gray-500">
                          <MapPin size={12} />
                          {c.location}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.skills
                          .filter((s) => s.skill_type === 'technical')
                          .slice(0, 3)
                          .map((s) => (
                            <Badge key={s.skill_id} variant="indigo">
                              {s.skill_name}
                            </Badge>
                          ))}
                        {c.skills.filter((s) => s.skill_type === 'technical')
                          .length > 3 && (
                          <Badge variant="gray">
                            +
                            {c.skills.filter((s) => s.skill_type === 'technical')
                              .length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {c.latest_status ? (
                        <StatusBadge status={c.latest_status.status} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden xl:table-cell text-xs text-gray-400">
                      {format(new Date(c.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    totalPages <= 5
                      ? i + 1
                      : page <= 3
                      ? i + 1
                      : page >= totalPages - 2
                      ? totalPages - 4 + i
                      : page - 2 + i
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CandidatesList
