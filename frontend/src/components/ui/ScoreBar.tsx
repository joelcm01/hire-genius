import React from 'react'

interface ScoreBarProps {
  score: number        // 0-100
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

function getColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getTextColor(score: number): string {
  if (score >= 80) return 'text-green-700'
  if (score >= 60) return 'text-blue-700'
  if (score >= 40) return 'text-yellow-700'
  return 'text-red-700'
}

const HEIGHT: Record<NonNullable<ScoreBarProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

const ScoreBar: React.FC<ScoreBarProps> = ({
  score,
  label,
  showValue = true,
  size = 'md',
  animate = true,
}) => {
  const clamped = Math.min(100, Math.max(0, score))
  const colorClass = getColor(clamped)
  const textColorClass = getTextColor(clamped)
  const heightClass = HEIGHT[size]

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-xs font-medium text-gray-600">{label}</span>
          )}
          {showValue && (
            <span className={`text-xs font-semibold ${textColorClass}`}>
              {clamped.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full ${heightClass} overflow-hidden`}>
        <div
          className={`${heightClass} rounded-full ${colorClass} ${animate ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

export default ScoreBar
