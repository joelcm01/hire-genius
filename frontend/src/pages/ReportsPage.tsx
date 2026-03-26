import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getVacancies } from '../api/vacancies'
import { getVacancyRanking, generateReport } from '../api/evaluations'
import ScoreBar from '../components/ui/ScoreBar'

const ReportsPage: React.FC = () => {
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([])
  const [generating, setGenerating] = useState(false)

  const { data: vacancies } = useQuery({
    queryKey: ['vacancies'],
    queryFn: () => getVacancies().then(r => r.data),
  })

  const { data: ranking, isLoading: loadingRanking } = useQuery({
    queryKey: ['ranking', selectedVacancyId],
    queryFn: () => getVacancyRanking(selectedVacancyId!).then(r => r.data),
    enabled: !!selectedVacancyId,
  })

  const toggleCandidate = (candidateId: number) => {
    setSelectedCandidateIds(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  const selectAll = () => {
    if (!ranking) return
    const allIds = ranking.map((ev: any) => ev.candidate_id)
    setSelectedCandidateIds(allIds)
  }

  const clearSelection = () => setSelectedCandidateIds([])

  const handleGenerateReport = async () => {
    if (!selectedVacancyId || selectedCandidateIds.length === 0) {
      toast.error('Please select a vacancy and at least one candidate')
      return
    }
    setGenerating(true)
    try {
      const response = await generateReport(selectedVacancyId, selectedCandidateIds)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interview-compilation-vacancy-${selectedVacancyId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF report downloaded!')
    } catch {
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate interview compilation PDFs for your candidate shortlists.
        </p>
      </div>

      {/* Interview Compilation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Interview Compilation PDF</h2>
            <p className="text-sm text-gray-500">
              Select a vacancy and candidates to include in the PDF report.
            </p>
          </div>
        </div>

        {/* Step 1: Select Vacancy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            1. Select Vacancy
          </label>
          <select
            value={selectedVacancyId || ''}
            onChange={e => {
              setSelectedVacancyId(e.target.value ? parseInt(e.target.value) : null)
              setSelectedCandidateIds([])
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a vacancy...</option>
            {(vacancies || []).map((v: any) => (
              <option key={v.vacancy_id} value={v.vacancy_id}>
                {v.title} — {v.department}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Select Candidates */}
        {selectedVacancyId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                2. Select Candidates ({selectedCandidateIds.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>

            {loadingRanking ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            ) : !ranking || ranking.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">No candidates evaluated for this vacancy yet.</p>
                <p className="text-xs mt-1">Go to the vacancy page and evaluate candidates first.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {ranking.map((ev: any) => (
                  <label
                    key={ev.candidate_id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCandidateIds.includes(ev.candidate_id)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCandidateIds.includes(ev.candidate_id)}
                      onChange={() => toggleCandidate(ev.candidate_id)}
                      className="rounded text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ev.candidate_name}
                        </p>
                        <span className="text-sm font-bold text-blue-700 ml-2 shrink-0">
                          {ev.compatibility_score?.toFixed(0)}%
                        </span>
                      </div>
                      {ev.candidate_location && (
                        <p className="text-xs text-gray-500">{ev.candidate_location}</p>
                      )}
                      <div className="mt-1"><ScoreBar score={ev.compatibility_score} size="sm" showValue={false} /></div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {selectedCandidateIds.length > 0
              ? `${selectedCandidateIds.length} candidate(s) will be included in the PDF`
              : 'No candidates selected'}
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={generating || !selectedVacancyId || selectedCandidateIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <><Loader2 size={14} className="animate-spin" /> Generating...</>
            ) : (
              <><Download size={14} /> Generate PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
