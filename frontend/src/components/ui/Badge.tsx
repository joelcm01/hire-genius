import React from 'react'
import type { CandidateStatus } from '../../api/types'

type StatusValue = CandidateStatus['status']

interface StatusConfig {
  label: string
  className: string
}

const STATUS_CONFIG: Record<StatusValue, StatusConfig> = {
  en_proceso: {
    label: 'In Process',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  contratado: {
    label: 'Hired',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  no_apto: {
    label: 'Not Suitable',
    className: 'bg-red-100 text-red-800 border border-red-200',
  },
  en_espera: {
    label: 'On Hold',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  },
  descartado: {
    label: 'Discarded',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
}

interface BadgeProps {
  status: StatusValue
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${config.className}`}
    >
      {config.label}
    </span>
  )
}

interface GenericBadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'indigo'
  size?: 'sm' | 'md'
}

const VARIANT_CLASSES: Record<NonNullable<GenericBadgeProps['variant']>, string> = {
  blue:   'bg-blue-100 text-blue-800 border border-blue-200',
  green:  'bg-green-100 text-green-800 border border-green-200',
  red:    'bg-red-100 text-red-800 border border-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  gray:   'bg-gray-100 text-gray-600 border border-gray-200',
  purple: 'bg-purple-100 text-purple-800 border border-purple-200',
  indigo: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
}

export const Badge: React.FC<GenericBadgeProps> = ({
  children,
  variant = 'blue',
  size = 'sm',
}) => {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  )
}

export default StatusBadge
