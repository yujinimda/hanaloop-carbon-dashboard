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

export type GhgScope = (typeof GHG_SCOPE)[ActivityType]

// User-facing scope labels (single source of truth for UI strings).
// Detail label is derived from GHG_SCOPE membership so adding an activity
// type updates the label automatically.
export const SCOPE_DETAIL_LABELS = {
  'Scope 2': scopeDetailLabel('Scope 2'),
  'Scope 3': scopeDetailLabel('Scope 3'),
} as const satisfies Record<GhgScope, string>

function scopeDetailLabel(scope: GhgScope): string {
  const types = (Object.keys(GHG_SCOPE) as ActivityType[]).filter((t) => GHG_SCOPE[t] === scope)
  return `${scope} (${types.join('·')})`
}

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
