import type { Activity, ActivityType, EmissionFactor, EmissionResult, MonthlyTotal } from './types'

/**
 * 배출량 계산: 활동량 × 배출계수 = kgCO₂e
 * matchKey 패턴: "type:description" (예: "전기:한국전력")
 */
export function calculateEmission(activity: Activity, factors: EmissionFactor[]): EmissionResult {
  const matchKey = `${activity.type}:${activity.description}`
  const factor = factors.find((f) => f.matchKey === matchKey)

  return {
    activityId: activity.id,
    date: activity.date,
    type: activity.type,
    description: activity.description,
    amount: activity.amount,
    activityUnit: activity.unit,
    factor: factor?.factor ?? 0,
    emission: factor ? activity.amount * factor.factor : 0,
  }
}

/**
 * 전체 활동 배출량 계산
 */
export function calculateAllEmissions(
  activities: Activity[],
  factors: EmissionFactor[],
): EmissionResult[] {
  return activities.map((a) => calculateEmission(a, factors))
}

/**
 * 월별 총 배출량 집계 (월 기준 정렬)
 */
export function aggregateByMonth(results: EmissionResult[]): MonthlyTotal[] {
  const map = new Map<string, MonthlyTotal>()

  for (const r of results) {
    const month = r.date.slice(0, 7) // "2025-01"
    if (!map.has(month)) {
      map.set(month, {
        month,
        total: 0,
        byType: { 전기: 0, 원소재: 0, 운송: 0 },
      })
    }
    const entry = map.get(month)!
    entry.total += r.emission
    entry.byType[r.type] += r.emission
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * 카테고리별 총 배출량 집계
 */
export function aggregateByType(results: EmissionResult[]): Record<ActivityType, number> {
  return results.reduce(
    (acc, r) => {
      acc[r.type] += r.emission
      return acc
    },
    { 전기: 0, 원소재: 0, 운송: 0 } as Record<ActivityType, number>,
  )
}

/**
 * 전월 대비 변화율 (%)
 * latestMonth가 없거나 prevMonth가 없으면 null 반환
 */
export function monthOverMonthChange(monthly: MonthlyTotal[], targetMonth: string): number | null {
  const sorted = [...monthly].sort((a, b) => a.month.localeCompare(b.month))
  const idx = sorted.findIndex((m) => m.month === targetMonth)
  if (idx <= 0) return null
  const prev = sorted[idx - 1].total
  if (prev === 0) return null
  return ((sorted[idx].total - prev) / prev) * 100
}

/**
 * kgCO₂e → 표시용 문자열 (1000kg 이상은 tCO₂e로)
 */
export function formatEmission(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} tCO₂e`
  }
  return `${kg.toFixed(2)} kgCO₂e`
}
