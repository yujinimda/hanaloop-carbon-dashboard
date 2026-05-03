import type { ActivityType } from '@/shared/types'

export const QUERY_KEYS = {
  activities: 'activities',
  emissionFactors: 'emission-factors',
} as const

export const GHG_SCOPE = {
  전기: 'Scope 2',
  원소재: 'Scope 3',
  운송: 'Scope 3',
} as const satisfies Record<ActivityType, string>

export const CHART_COLORS = {
  전기: 'var(--color-chart-1)',
  원소재: 'var(--color-chart-2)',
  운송: 'var(--color-chart-3)',
} as const satisfies Record<ActivityType, string>

export const ACTIVITY_UNITS = {
  전기: 'kWh',
  원소재: 'kg',
  운송: 'ton-km',
} as const satisfies Record<ActivityType, string>
