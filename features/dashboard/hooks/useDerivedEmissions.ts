'use client'

import { useMemo } from 'react'
import { useActivities } from '@/shared/hooks/useActivities'
import { useEmissionFactors } from '@/shared/hooks/useEmissionFactors'
import {
  calculateAllEmissions,
  aggregateByMonth,
  monthOverMonthChange,
} from '@/shared/lib/calculations'
import { GHG_SCOPE } from '@/shared/constants'
import type { ActivityType, MonthlyTotal } from '@/shared/types'

type DerivedEmissions = {
  isLoading: boolean
  error: Error | undefined
  latestMonth: MonthlyTotal | null
  totalThisMonth: number
  momChangePct: number | null
  scope2Pct: number
  scope3Pct: number
}

export function useDerivedEmissions(): DerivedEmissions {
  const { activities, error: activitiesError, isLoading: activitiesLoading } = useActivities()
  const { factors, error: factorsError, isLoading: factorsLoading } = useEmissionFactors()

  return useMemo<DerivedEmissions>(() => {
    const isLoading = activitiesLoading || factorsLoading
    const error = activitiesError ?? factorsError

    if (activities.length === 0 || factors.length === 0) {
      return {
        isLoading,
        error,
        latestMonth: null,
        totalThisMonth: 0,
        momChangePct: null,
        scope2Pct: 0,
        scope3Pct: 0,
      }
    }

    const monthly = aggregateByMonth(calculateAllEmissions(activities, factors))
    const latest = monthly.at(-1) ?? null

    if (!latest) {
      return {
        isLoading,
        error,
        latestMonth: null,
        totalThisMonth: 0,
        momChangePct: null,
        scope2Pct: 0,
        scope3Pct: 0,
      }
    }

    const total = latest.total
    const scope2Total = sumByScope(latest.byType, 'Scope 2')
    const scope3Total = sumByScope(latest.byType, 'Scope 3')
    const denom = scope2Total + scope3Total

    return {
      isLoading,
      error,
      latestMonth: latest,
      totalThisMonth: total,
      momChangePct: monthOverMonthChange(monthly, latest.month),
      scope2Pct: denom > 0 ? (scope2Total / denom) * 100 : 0,
      scope3Pct: denom > 0 ? (scope3Total / denom) * 100 : 0,
    }
  }, [activities, factors, activitiesError, factorsError, activitiesLoading, factorsLoading])
}

function sumByScope(byType: Record<ActivityType, number>, scope: 'Scope 2' | 'Scope 3'): number {
  let sum = 0
  for (const type of Object.keys(byType) as ActivityType[]) {
    if (GHG_SCOPE[type] === scope) sum += byType[type]
  }
  return sum
}
