import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Zap,
  User,
  Mail,
  MessageSquare,
  FileText,
  ChevronDown,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getVacancy } from '../api/vacancies'
import { getVacancyRanking, evaluateAllCandidates } from '../api/evaluations'
import { updateCandidateStatus } from '../api/candidates'
import { Badge } from '../components/ui/Badge'
import { StatusBadge } from '../components/ui/Badge'
import ScoreBar from '../components/ui/ScoreBar'
import Modal from '../components/ui/Modal'
import type { CandidateStatus } from '../api/types'

const STATUS_OPTIONS: { value: CandidateStatus['status']; label: string }[] = [
  { value: 'en_proceso', label: 'In Process' },
  { value: 'en_espera', label: 'On Hold' },
  { value: 'contratado', label: 'Hired' },
  { value: 'no_apto', label: 'Not Suitable' },
  { value: 'descartado', label: 'Discarded' },
]

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1)
    return (
      <span className="w-7 h-7 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-sm font-bold border border-yellow-200">
        <Trophy size={13} />
      </span>
    )
  if (rank === 2)
    return (
      <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold border border-gray-200">
        2
      </span>
    )
  if (rank === 3)
    return (
      <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold border border-orange-200">
        3
      </span>
    )
  return (
    <span className="w-7 h-7 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center text-xs font-medium border border-gray-200">
      {rank}
    </span>
  )
}

const VacancyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const vacancyId = parseInt(id ?? '0', 10)

  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus['status']>('en_proceso')
  const [confirmNoApto, setConfirmNoApto] = useState(false)

  const { data: vacancy, isLoading: loadingVacancy } = useQuery({
    queryKey: ['vacancy', vacancyId],
    queryFn: () => getVacancy(vacancyId).then((r) => r.data),
    enabled: !!vacancyId,
  })

  const {
    data: ranking,
    isLoading: loadingRanking,
    refetch: refetchRanking,
  } = useQuery({
    queryKey: ['ranking', vacancyId],
    queryFn: () => getVacancyRanking(vacancyId).then((r) => r.data),
    enabled: !!vacancyId,
  })

  const evaluateAllMutation = useMutation({
    mutationFn: () => evaluateAllCandidates(vacancyId).then((r) => r.data),
    onSuccess: (result) => {
      toast.success(
        `Evaluated ${result.evaluated} candidates${result.errors > 0 ? ` (${result.errors} errors)` : ''}`,
      )
      refetchRanking()
      queryClient.invalidateQueries({ queryKey: ['ranking', vacancyId] })
    },
    onError: () => {
      toast.error('Evaluation failed. Please try again.')
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({
      candidateId,
      status,
    }: {
      candidateId: number
      status: CandidateStatus['status']
    }) =>
      updateCandidateStatus(candidateId, { status }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Status updated!')
      queryClient.invalidateQueries({ queryKey: ['ranking', vacancyId] })
      setStatusModalOpen(false)
      setConfirmNoApto(false)
    },
    onError: () => {
      toast.error('Failed to update status.')
    },
  })

  const openStatusModal = (candidateId: number, currentStatus?: CandidateStatus['status']) => {
    setSelectedCandidateId(candidateId)
    setSelectedStatus(currentStatus ?? 'en_proceso')
    setConfirmNoApto(false)
    setStatusModalOpen(true)
  }

  const handleStatusSave = () => {
    if (!selectedCandidateId) return
    if (selectedStatus === 'no_apto' && !confirmNoApto) {
      setConfirmNoApto(true)
      return
    }
    statusMutation.mutate({ candidateId: selectedCandidateId, status: selectedStatus })
  }

  if (loadingVacancy) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!vacancy) {
    return (
      <div className="p-6 text-center text-gray-500">Vacancy not found.</div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/vacancies')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {vacancy.title}
            </h1>
            {vacancy.is_active ? (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <CheckCircle size={11} />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                <XCircle size={11} />
                Closed
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {vacancy.department} &middot; {vacancy.open_positions} open{' '}
            {vacancy.open_positions === 1 ? 'position' : 'positions'} &middot;{' '}
            {vacancy.required_experience_years}y experience required
          </p>
        </div>
        <button
          onClick={() => evaluateAllMutation.mutate()}
          disabled={evaluateAllMutation.isPending}
          className="btn-primary shrink-0"
        >
          {evaluateAllMutation.isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Zap size={15} />
          )}
          {evaluateAllMutation.isPending ? 'Evaluating…' : 'Evaluate All'}
        </button>
      </div>

      {/* Vacancy details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Description */}
        {vacancy.description && (
          <div className="card p-5 lg:col-span-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {vacancy.description}
            </p>
          </div>
        )}

        {/* Requirements */}
        {vacancy.requirements.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Requirements
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {vacancy.requirements.map((req, i) => (
                <Badge key={i} variant="indigo">
                  {req}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Values */}
        {vacancy.values.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Company Values
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {vacancy.values.map((val, i) => (
                <Badge key={i} variant="purple">
                  {val}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rankings */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Candidate Rankings</h2>
          <span className="text-sm text-gray-400">
            {ranking?.length ?? 0} evaluated candidates
          </span>
        </div>

        {loadingRanking ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
            Loading rankings…
          </div>
        ) : !ranking?.length ? (
          <div className="p-12 text-center">
            <Zap size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No evaluations yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Click "Evaluate All" to rank all candidates for this vacancy
            </p>
            <button
              onClick={() => evaluateAllMutation.mutate()}
              disabled={evaluateAllMutation.isPending}
              className="btn-primary"
            >
              <Zap size={15} />
              Evaluate All Candidates
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 w-10">#</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Candidate</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Location</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Score</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">Sub-scores</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ranking.map((ev, index) => {
                  const candidate = ev.candidate
                  return (
                    <tr
                      key={ev.evaluation_id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <RankBadge rank={index + 1} />
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {candidate?.name ?? `Candidate #${ev.candidate_id}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {candidate?.email}
                          </p>
                          {candidate?.skills && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {candidate.skills
                                .filter((s) => s.skill_type === 'technical')
                                .slice(0, 3)
                                .map((s) => (
                                  <Badge key={s.skill_id} variant="indigo">
                                    {s.skill_name}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-gray-500">
                        {candidate?.location ?? '—'}
                      </td>
                      <td className="px-5 py-3 min-w-[140px]">
                        <ScoreBar
                          score={ev.compatibility_score}
                          size="md"
                          showValue
                        />
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <div className="space-y-1 min-w-[180px]">
                          <ScoreBar
                            score={ev.requirements_score}
                            label="Requirements"
                            size="sm"
                          />
                          <ScoreBar
                            score={ev.values_alignment_score}
                            label="Values"
                            size="sm"
                          />
                          <ScoreBar
                            score={ev.experience_relevance_score}
                            label="Experience"
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {candidate?.latest_status ? (
                          <StatusBadge status={candidate.latest_status.status} />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              navigate(`/candidates/${ev.candidate_id}`)
                            }
                            title="View profile"
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <User size={15} />
                          </button>
                          {candidate?.email && (
                            <a
                              href={`mailto:${candidate.email}?subject=Re: ${vacancy.title} Position`}
                              title="Send email"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Mail size={15} />
                            </a>
                          )}
                          {candidate?.phone && (
                            <a
                              href={`https://wa.me/${candidate.phone.replace(/\D/g, '')}?text=Hi ${encodeURIComponent(candidate.name)}, we'd like to discuss the ${encodeURIComponent(vacancy.title)} position.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp"
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <MessageSquare size={15} />
                            </a>
                          )}
                          <button
                            onClick={() =>
                              openStatusModal(
                                ev.candidate_id,
                                candidate?.latest_status?.status,
                              )
                            }
                            title="Change status"
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <ChevronDown size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Report shortcut */}
      {ranking && ranking.length > 0 && (
        <div className="card p-4 flex items-center justify-between bg-primary-50 border-primary-200">
          <div>
            <p className="text-sm font-semibold text-primary-900">
              Generate Interview Compilation Report
            </p>
            <p className="text-xs text-primary-600 mt-0.5">
              Download a PDF with profiles and scores for selected candidates
            </p>
          </div>
          <button
            onClick={() => navigate('/reports', { state: { vacancyId } })}
            className="btn-primary text-sm shrink-0"
          >
            <FileText size={15} />
            Go to Reports
          </button>
        </div>
      )}

      {/* Status change modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Change Candidate Status"
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStatus === opt.value
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  checked={selectedStatus === opt.value}
                  onChange={() => {
                    setSelectedStatus(opt.value)
                    setConfirmNoApto(false)
                  }}
                  className="text-primary-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>

          {confirmNoApto && selectedStatus === 'no_apto' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              Are you sure? This marks the candidate as not suitable for this
              position. Click Save again to confirm.
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setStatusModalOpen(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusSave}
              disabled={statusMutation.isPending}
              className={
                selectedStatus === 'no_apto' && confirmNoApto
                  ? 'btn-danger text-sm'
                  : 'btn-primary text-sm'
              }
            >
              {statusMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default VacancyDetail
