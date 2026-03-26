import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  FileText,
  Download,
  Loader2,
  CheckSquare,
  Square,
  Trophy,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getVacancies } from '../api/vacancies'
import { getVacancyRanking, generateReport } from '../api/evaluations'
import type { Evaluation, Vacancy } from '../api/types'
import ScoreBar from '../components/ui/ScoreBar'
import { StatusBadge } from '../components/ui/Badge'

interface LocationState {
  vacancyId?: number
}

const ReportsPage: React.FC = () => {
  const location = useLocation()
  const locationState = location.state as LocationState | null

  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(
    locationState?.vacancyId ?? null,
  )
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<number>>(
    new Set(),
  )
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadFilename, setDownloadFilename] = useState('report.pdf')

  useEffect(() => {
    setDownloadUrl(null)
    setSelectedCandidateIds(new Set())
  }, [selectedVacancyId])

  const { data: vacancies } = useQuery({
    queryKey: ['vacancies'],
    queryFn: () => getVacancies().then((r) => r.data),
  })

  const { data: ranking, isLoading: loadingRanking } = useQuery({
    queryKey: ['ranking', selectedVacancyId],
    queryFn: () => getVacancyRanking(selectedVacancyId!).then((r) => r.data),
    enabled: !!selectedVacancyId,
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      generateReport(selectedVacancyId!, Array.from(selectedCandidateIds)),
    onSuccess: (response) => {
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      const vacancy = vacancies?.find((v: Vacancy) => v.vacancy_id === selectedVacancyId)
      setDownloadFilename(
        `interview-compilation-${vacancy?.title?.replace(/\s+/g, '-').toLowerCase() ?? selectedVacancyId}.pdf`,
      )
      toast.success('PDF report generated successfully!')
    },
    onError: () => {
      toast.error('Failed to generate report. Please try again.')
    },
  })

  const toggleCandidate = (candidateId: number) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev)
      if (next.has(candidateId)) {
        next.delete(candidateId)
      } else {
        next.add(candidateId)
      }
      return next
    })
    setDownloadUrl(null)
  }

  const selectAll = () => {
    if (!ranking) return
    setSelectedCandidateIds(new Set((ranking as Evaluation[]).map((ev) => ev.candidate_id)))
    setDownloadUrl(null)
  }

  const selectNone = () => {
    setSelectedCandidateIds(new Set())
    setDownloadUrl(null)
  }

  const selectTopN = (n: number) => {
    if (!ranking) return
    setSelectedCandidateIds(
      new Set((ranking as Evaluation[]).slice(0, n).map((ev) => ev.candidate_id)),
    )
    setDownloadUrl(null)
  }

  const selectedVacancy = vacancies?.find(
    (v: Vacancy) => v.vacancy_id === selectedVacancyId,
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Generate interview compilation PDFs for selected candidates
        </p>
      </div>

      {/* Step 1: Select Vacancy */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
            1
          </span>
          <h2 className="font-semibold text-gray-900">Select Vacancy</h2>
        </div>

        {!vacancies ? (
          <div className="text-sm text-gray-400">Loading vacancies…</div>
        ) : vacancies.length === 0 ? (
          <div className="text-sm text-gray-400">No vacancies found. Create a vacancy first.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {vacancies.map((v: Vacancy) => (
              <button
                key={v.vacancy_id}
                onClick={() => setSelectedVacancyId(v.vacancy_id)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  selectedVacancyId === v.vacancy_id
                    ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-300'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-medium text-gray-900 truncate">{v.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{v.department}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Select Candidates */}
      {selectedVacancyId && (
        <div className="card p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="font-semibold text-gray-900">Select Candidates</h2>
            </div>
            {ranking && ranking.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={selectAll} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={selectNone} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                  Clear
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={() => selectTopN(3)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Top 3</button>
                <button onClick={() => selectTopN(5)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Top 5</button>
                <button onClick={() => selectTopN(10)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Top 10</button>
              </div>
            )}
          </div>

          {loadingRanking ? (
            <div className="py-8 text-center text-gray-400">
              <Loader2 size={24} className="animate-spin mx-auto mb-2" />
              Loading rankings…
            </div>
          ) : !ranking || ranking.length === 0 ? (
            <div className="py-8 text-center">
              <FileText size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No evaluated candidates for <strong>{selectedVacancy?.title}</strong></p>
              <p className="text-xs text-gray-400 mt-1">Go to the vacancy page and click "Evaluate All" first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(ranking as Evaluation[]).map((ev, index) => {
                const isSelected = selectedCandidateIds.has(ev.candidate_id)
                const candidate = ev.candidate
                return (
                  <button
                    key={ev.evaluation_id}
                    onClick={() => toggleCandidate(ev.candidate_id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      isSelected ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="shrink-0 text-primary-500">
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
                    </div>
                    <div className="shrink-0">
                      {index < 3 ? (
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {index === 0 ? <Trophy size={12} /> : index + 1}
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center text-xs font-medium border border-gray-200">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">
                          {candidate?.name ?? `Candidate #${ev.candidate_id}`}
                        </p>
                        {candidate?.latest_status && (
                          <StatusBadge status={candidate.latest_status.status} />
                        )}
                      </div>
                      {candidate?.location && (
                        <p className="text-xs text-gray-400 mt-0.5">{candidate.location}</p>
                      )}
                    </div>
                    <div className="w-32 shrink-0">
                      <ScoreBar score={ev.compatibility_score} size="sm" showValue />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {selectedCandidateIds.size > 0 && (
            <p className="mt-3 text-sm text-primary-600 font-medium">
              {selectedCandidateIds.size} candidate{selectedCandidateIds.size !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      )}

      {/* Step 3: Generate */}
      {selectedVacancyId && selectedCandidateIds.size > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="font-semibold text-gray-900">Generate Report</h2>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700">
                Generate a PDF interview compilation for <strong>{selectedVacancy?.title}</strong> with{' '}
                <strong>{selectedCandidateIds.size}</strong> selected candidate{selectedCandidateIds.size !== 1 ? 's' : ''}.
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                The report includes candidate profiles, AI scores, strengths, and gaps.
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="btn-primary"
              >
                {generateMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <FileText size={15} />
                )}
                {generateMutation.isPending ? 'Generating…' : 'Generate PDF'}
              </button>

              {downloadUrl && (
                <a href={downloadUrl} download={downloadFilename} className="btn-secondary text-green-600 border-green-200 hover:bg-green-50">
                  <Download size={15} />
                  Download PDF
                </a>
              )}
            </div>
          </div>

          {downloadUrl && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
              <CheckSquare size={16} />
              Report is ready! Click "Download PDF" to save it.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ReportsPage
