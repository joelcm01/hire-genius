import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Download,
  MessageSquare,
  Plus,
  Briefcase,
  Star,
  Clock,
  CheckCircle,
  Loader2,
  CalendarDays,
  Building2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import {
  getCandidate,
  getCandidateCVUrl,
  updateCandidateStatus,
  getCandidateContacts,
  logContact,
  getCandidateFeedback,
  addInterviewFeedback,
} from '../api/candidates'
import { getCandidateEvaluations } from '../api/evaluations'
import { StatusBadge, Badge } from '../components/ui/Badge'
import ScoreBar from '../components/ui/ScoreBar'
import Modal from '../components/ui/Modal'
import type {
  CandidateStatus,
  LogContactPayload,
  AddFeedbackPayload,
} from '../api/types'

const STATUS_OPTIONS: { value: CandidateStatus['status']; label: string }[] = [
  { value: 'en_proceso', label: 'In Process' },
  { value: 'en_espera', label: 'On Hold' },
  { value: 'contratado', label: 'Hired' },
  { value: 'no_apto', label: 'Not Suitable' },
  { value: 'descartado', label: 'Discarded' },
]

const CONTACT_METHODS = ['Email', 'WhatsApp', 'Phone', 'Video Call', 'In-Person', 'LinkedIn']
const RECOMMENDATIONS = ['Strongly Recommend', 'Recommend', 'Neutral', 'Do Not Recommend']

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const candidateId = parseInt(id ?? '0', 10)

  // Modal states
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [confirmNoApto, setConfirmNoApto] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus['status']>('en_proceso')

  const [contactForm, setContactForm] = useState<LogContactPayload>({
    contact_method: 'Email',
    contact_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    responsible: '',
    notes: '',
  })

  const [feedbackForm, setFeedbackForm] = useState<AddFeedbackPayload>({
    interview_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    rating: 3,
    strengths: '',
    improvements: '',
    recommendation: 'Recommend',
    notes: '',
  })

  // Queries
  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => getCandidate(candidateId).then((r) => r.data),
    enabled: !!candidateId,
  })

  const { data: evaluations } = useQuery({
    queryKey: ['candidate-evaluations', candidateId],
    queryFn: () => getCandidateEvaluations(candidateId).then((r) => r.data),
    enabled: !!candidateId,
  })

  const { data: contacts, refetch: refetchContacts } = useQuery({
    queryKey: ['candidate-contacts', candidateId],
    queryFn: () => getCandidateContacts(candidateId).then((r) => r.data),
    enabled: !!candidateId,
  })

  const { data: feedbacks, refetch: refetchFeedback } = useQuery({
    queryKey: ['candidate-feedback', candidateId],
    queryFn: () => getCandidateFeedback(candidateId).then((r) => r.data),
    enabled: !!candidateId,
  })

  // Mutations
  const statusMutation = useMutation({
    mutationFn: (status: CandidateStatus['status']) =>
      updateCandidateStatus(candidateId, { status }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Status updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] })
      setStatusModalOpen(false)
      setConfirmNoApto(false)
    },
    onError: () => toast.error('Failed to update status.'),
  })

  const contactMutation = useMutation({
    mutationFn: (data: LogContactPayload) =>
      logContact(candidateId, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Contact logged!')
      refetchContacts()
      setContactModalOpen(false)
      setContactForm({
        contact_method: 'Email',
        contact_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        responsible: '',
        notes: '',
      })
    },
    onError: () => toast.error('Failed to log contact.'),
  })

  const feedbackMutation = useMutation({
    mutationFn: (data: AddFeedbackPayload) =>
      addInterviewFeedback(candidateId, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Interview feedback saved!')
      refetchFeedback()
      setFeedbackModalOpen(false)
    },
    onError: () => toast.error('Failed to save feedback.'),
  })

  const handleDownloadCV = async () => {
    try {
      const res = await getCandidateCVUrl(candidateId)
      window.open(res.data.url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Could not retrieve CV URL.')
    }
  }

  const openStatusModal = () => {
    setSelectedStatus(candidate?.latest_status?.status ?? 'en_proceso')
    setConfirmNoApto(false)
    setStatusModalOpen(true)
  }

  const handleStatusSave = () => {
    if (selectedStatus === 'no_apto' && !confirmNoApto) {
      setConfirmNoApto(true)
      return
    }
    statusMutation.mutate(selectedStatus)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="p-6 text-center text-gray-500">Candidate not found.</div>
    )
  }

  const technicalSkills = candidate.skills.filter((s) => s.skill_type === 'technical')
  const softSkills = candidate.skills.filter((s) => s.skill_type === 'soft')
  const whatsappUrl = candidate.phone
    ? `https://wa.me/${candidate.phone.replace(/\D/g, '')}?text=Hi ${encodeURIComponent(candidate.name)}, we found your profile and would like to connect regarding a job opportunity.`
    : null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/candidates')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Candidates
      </button>

      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold shrink-0">
              {candidate.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} />
                  <a
                    href={`mailto:${candidate.email}`}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {candidate.email}
                  </a>
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} />
                    {candidate.phone}
                  </span>
                )}
                {candidate.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {candidate.location}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {candidate.latest_status && (
                  <StatusBadge status={candidate.latest_status.status} size="md" />
                )}
                {candidate.latest_status?.changed_at && (
                  <span className="text-xs text-gray-400">
                    Updated{' '}
                    {formatDistanceToNow(
                      new Date(candidate.latest_status.changed_at),
                      { addSuffix: true },
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={handleDownloadCV} className="btn-secondary text-sm">
              <Download size={14} />
              Download CV
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm text-green-600 border-green-200 hover:border-green-300 hover:bg-green-50"
              >
                <MessageSquare size={14} />
                WhatsApp
              </a>
            )}
            <button
              onClick={() => setContactModalOpen(true)}
              className="btn-secondary text-sm"
            >
              <Plus size={14} />
              Log Contact
            </button>
            <button onClick={openStatusModal} className="btn-primary text-sm">
              Change Status
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Technical skills */}
          {technicalSkills.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-primary-500" />
                Technical Skills
              </h3>
              <div className="space-y-2">
                {technicalSkills.map((skill) => (
                  <div
                    key={skill.skill_id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700">
                      {skill.skill_name}
                    </span>
                    <Badge variant="indigo">{skill.proficiency_level}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Soft skills */}
          {softSkills.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Soft Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {softSkills.map((skill) => (
                  <Badge key={skill.skill_id} variant="purple">
                    {skill.skill_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Experience */}
          {candidate.experiences.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-primary-500" />
                Experience
              </h3>
              <div className="space-y-4">
                {candidate.experiences.map((exp) => (
                  <div
                    key={exp.experience_id}
                    className="relative pl-5 border-l-2 border-gray-100"
                  >
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary-400" />
                    <div className="flex items-start justify-between flex-wrap gap-1">
                      <div>
                        <p className="font-medium text-gray-900">
                          {exp.position}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Building2 size={12} />
                          {exp.company}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        <p>
                          {exp.start_date
                            ? format(new Date(exp.start_date), 'MMM yyyy')
                            : '?'}{' '}
                          –{' '}
                          {exp.end_date
                            ? format(new Date(exp.end_date), 'MMM yyyy')
                            : 'Present'}
                        </p>
                        <p>{exp.duration_months} months</p>
                      </div>
                    </div>
                    {exp.description && (
                      <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compatibility scores */}
          {evaluations && evaluations.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star size={16} className="text-yellow-500" />
                Vacancy Compatibility
              </h3>
              <div className="space-y-5">
                {evaluations.map((ev) => (
                  <div key={ev.evaluation_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Vacancy #{ev.vacancy_id}
                      </p>
                      <span className="text-xs text-gray-400">
                        {format(new Date(ev.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <ScoreBar
                      score={ev.compatibility_score}
                      label="Overall"
                      size="md"
                    />
                    <div className="grid grid-cols-2 gap-2 pt-1">
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
                      <ScoreBar
                        score={ev.stability_score}
                        label="Stability"
                        size="sm"
                      />
                    </div>
                    {ev.reasoning && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed bg-gray-50 p-3 rounded-lg">
                        {ev.reasoning}
                      </p>
                    )}
                    {(ev.strengths.length > 0 || ev.gaps.length > 0) && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {ev.strengths.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-green-700 mb-1">
                              Strengths
                            </p>
                            <ul className="text-xs text-gray-600 space-y-0.5">
                              {ev.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {ev.gaps.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-orange-700 mb-1">
                              Gaps
                            </p>
                            <ul className="text-xs text-gray-600 space-y-0.5">
                              {ev.gaps.map((g, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-orange-500 mt-0.5">!</span>
                                  {g}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact history */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={16} className="text-primary-500" />
                Contact History
              </h3>
              <button
                onClick={() => setContactModalOpen(true)}
                className="btn-secondary text-xs py-1.5"
              >
                <Plus size={13} />
                Log Contact
              </button>
            </div>
            {!contacts || contacts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No contacts logged yet
              </p>
            ) : (
              <div className="space-y-3">
                {contacts.map((c) => (
                  <div
                    key={c.contact_id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {c.contact_method[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <p className="text-sm font-medium text-gray-700">
                          {c.contact_method}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(c.contact_date), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      {c.responsible && (
                        <p className="text-xs text-gray-500">
                          By: {c.responsible}
                        </p>
                      )}
                      {c.notes && (
                        <p className="text-xs text-gray-600 mt-1">{c.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interview feedback */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarDays size={16} className="text-primary-500" />
                Interview Feedback
              </h3>
              <button
                onClick={() => setFeedbackModalOpen(true)}
                className="btn-secondary text-xs py-1.5"
              >
                <Plus size={13} />
                Add Feedback
              </button>
            </div>
            {!feedbacks || feedbacks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No interview feedback yet
              </p>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.feedback_id}
                    className="p-4 border border-gray-100 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < fb.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-200 fill-gray-200'
                            }
                          />
                        ))}
                        <span className="text-xs text-gray-500">
                          {fb.rating}/5
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(fb.interview_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {fb.strengths && (
                        <div>
                          <p className="font-medium text-green-700 mb-0.5">
                            Strengths
                          </p>
                          <p className="text-gray-600">{fb.strengths}</p>
                        </div>
                      )}
                      {fb.improvements && (
                        <div>
                          <p className="font-medium text-orange-700 mb-0.5">
                            Improvements
                          </p>
                          <p className="text-gray-600">{fb.improvements}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        Recommendation:
                      </span>
                      <Badge
                        variant={
                          fb.recommendation.toLowerCase().includes('strongly')
                            ? 'green'
                            : fb.recommendation.toLowerCase().includes('not')
                            ? 'red'
                            : fb.recommendation.toLowerCase().includes('recommend')
                            ? 'blue'
                            : 'gray'
                        }
                      >
                        {fb.recommendation}
                      </Badge>
                    </div>
                    {fb.notes && (
                      <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                        {fb.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Change Status"
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
              This will mark the candidate as not suitable. Confirm by clicking
              Save again.
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

      {/* Log Contact Modal */}
      <Modal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title="Log Contact"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Method</label>
              <select
                value={contactForm.contact_method}
                onChange={(e) =>
                  setContactForm((p) => ({
                    ...p,
                    contact_method: e.target.value,
                  }))
                }
                className="input"
              >
                {CONTACT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date & Time</label>
              <input
                type="datetime-local"
                value={contactForm.contact_date}
                onChange={(e) =>
                  setContactForm((p) => ({
                    ...p,
                    contact_date: e.target.value,
                  }))
                }
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Responsible</label>
            <input
              type="text"
              value={contactForm.responsible}
              onChange={(e) =>
                setContactForm((p) => ({ ...p, responsible: e.target.value }))
              }
              placeholder="Your name"
              className="input"
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              rows={3}
              value={contactForm.notes}
              onChange={(e) =>
                setContactForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Summary of the contact…"
              className="input resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setContactModalOpen(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!contactForm.responsible.trim()) {
                  toast.error('Please enter the responsible person')
                  return
                }
                contactMutation.mutate(contactForm)
              }}
              disabled={contactMutation.isPending}
              className="btn-primary text-sm"
            >
              {contactMutation.isPending ? 'Saving…' : 'Log Contact'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Interview Feedback Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Add Interview Feedback"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Interview Date</label>
              <input
                type="datetime-local"
                value={feedbackForm.interview_date}
                onChange={(e) =>
                  setFeedbackForm((p) => ({
                    ...p,
                    interview_date: e.target.value,
                  }))
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">Rating (1-5)</label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      setFeedbackForm((p) => ({ ...p, rating: n }))
                    }
                    className="focus:outline-none"
                  >
                    <Star
                      size={24}
                      className={
                        n <= feedbackForm.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 fill-gray-200'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Recommendation</label>
            <select
              value={feedbackForm.recommendation}
              onChange={(e) =>
                setFeedbackForm((p) => ({
                  ...p,
                  recommendation: e.target.value,
                }))
              }
              className="input"
            >
              {RECOMMENDATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Strengths</label>
              <textarea
                rows={3}
                value={feedbackForm.strengths}
                onChange={(e) =>
                  setFeedbackForm((p) => ({ ...p, strengths: e.target.value }))
                }
                placeholder="What stood out positively…"
                className="input resize-none"
              />
            </div>
            <div>
              <label className="label">Areas for Improvement</label>
              <textarea
                rows={3}
                value={feedbackForm.improvements}
                onChange={(e) =>
                  setFeedbackForm((p) => ({
                    ...p,
                    improvements: e.target.value,
                  }))
                }
                placeholder="What could be better…"
                className="input resize-none"
              />
            </div>
          </div>

          <div>
            <label className="label">Additional Notes</label>
            <textarea
              rows={3}
              value={feedbackForm.notes}
              onChange={(e) =>
                setFeedbackForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Any other observations…"
              className="input resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setFeedbackModalOpen(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!feedbackForm.strengths.trim()) {
                  toast.error('Please enter at least the strengths')
                  return
                }
                feedbackMutation.mutate(feedbackForm)
              }}
              disabled={feedbackMutation.isPending}
              className="btn-primary text-sm"
            >
              {feedbackMutation.isPending ? 'Saving…' : 'Save Feedback'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CandidateDetail
