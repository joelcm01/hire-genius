import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Mail, Phone, ChevronRight } from 'lucide-react'
import type { Candidate, Evaluation } from '../api/types'
import { StatusBadge, Badge } from './ui/Badge'
import ScoreBar from './ui/ScoreBar'

interface CandidateCardProps {
  candidate: Candidate
  evaluation?: Evaluation
  showActions?: boolean
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  evaluation,
  showActions = true,
}) => {
  const navigate = useNavigate()
  const technicalSkills = candidate.skills
    .filter((s) => s.skill_type === 'technical')
    .slice(0, 4)

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Avatar + info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm shrink-0">
            {candidate.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {candidate.name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Mail size={11} />
                {candidate.email}
              </span>
              {candidate.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={11} />
                  {candidate.phone}
                </span>
              )}
              {candidate.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {candidate.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        {candidate.latest_status && (
          <div className="shrink-0">
            <StatusBadge status={candidate.latest_status.status} />
          </div>
        )}
      </div>

      {/* Score bar */}
      {evaluation && (
        <div className="mt-4">
          <ScoreBar
            score={evaluation.compatibility_score}
            label="Compatibility"
            size="md"
          />
        </div>
      )}

      {/* Skills */}
      {technicalSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {technicalSkills.map((skill) => (
            <Badge key={skill.skill_id} variant="indigo">
              {skill.skill_name}
            </Badge>
          ))}
          {candidate.skills.filter((s) => s.skill_type === 'technical').length >
            4 && (
            <Badge variant="gray">
              +
              {candidate.skills.filter((s) => s.skill_type === 'technical')
                .length - 4}{' '}
              more
            </Badge>
          )}
        </div>
      )}

      {/* Action */}
      {showActions && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => navigate(`/candidates/${candidate.candidate_id}`)}
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
          >
            View Profile
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export default CandidateCard
