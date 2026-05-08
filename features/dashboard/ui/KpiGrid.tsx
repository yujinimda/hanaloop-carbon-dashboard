'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'

import { Progress } from '@/shared/ui/progress'
import { cn } from '@/shared/lib/utils'
import { formatEmissionParts } from '@/shared/lib/calculations'
import { GHG_SCOPE, SCOPE_DETAIL_LABELS } from '@/shared/constants'

import { useDerivedEmissions } from '../hooks/useDerivedEmissions'
import { KpiCard } from './KpiCard'
import { KpiValue } from './KpiValue'

const SCOPE_2 = GHG_SCOPE['전기']
const SCOPE_3 = GHG_SCOPE['원소재']

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
})

function formatMonthLabel(month: string | undefined): string {
  if (!month) return '—'
  const [yyyy, mm] = month.split('-')
  return MONTH_LABEL_FORMATTER.format(new Date(Number(yyyy), Number(mm) - 1, 1))
}

export function KpiGrid() {
  const { isLoading, error, latestMonth, totalThisMonth, momChangePct, scope2Pct, scope3Pct } =
    useDerivedEmissions()

  if (error) {
    return (
      <p role="alert" className="text-destructive text-sm">
        데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
    )
  }

  if (isLoading || !latestMonth) {
    return <KpiGridSkeleton />
  }

  const monthLabel = formatMonthLabel(latestMonth.month)
  const total = formatEmissionParts(totalThisMonth)
  const isIncrease = (momChangePct ?? 0) > 0
  const ArrowIcon = isIncrease ? ArrowUp : ArrowDown

  return (
    <section aria-label="KPI 요약" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="총 PCF 배출량" caption={monthLabel} emph>
        <KpiValue
          value={total.value}
          unit={
            <>
              tCO<sub className="align-baseline text-xs">2</sub>e
            </>
          }
          unitClassName="text-primary-foreground/80"
        />
      </KpiCard>

      <KpiCard label="전월 대비 변화율" caption="전월 대비">
        {momChangePct === null ? (
          <KpiValue value="—" />
        ) : (
          <div
            className={cn(
              'flex items-baseline gap-1',
              isIncrease ? 'text-destructive' : 'text-foreground',
            )}
            aria-label={`전월 대비 ${Math.abs(momChangePct).toFixed(1)}퍼센트 ${isIncrease ? '증가' : '감소'}`}
          >
            <ArrowIcon className="size-5" aria-hidden />
            <p className="font-sans text-3xl leading-none font-semibold tracking-tight tabular-nums">
              {Math.abs(momChangePct).toFixed(1)}%
            </p>
          </div>
        )}
      </KpiCard>

      <KpiCard label={`${SCOPE_2} 비중`} caption={SCOPE_DETAIL_LABELS[SCOPE_2]}>
        <KpiValue value={`${scope2Pct.toFixed(0)}%`} />
        <Progress value={scope2Pct} aria-label={`${SCOPE_2} 비중 ${scope2Pct.toFixed(0)}퍼센트`} />
      </KpiCard>

      <KpiCard label={`${SCOPE_3} 비중`} caption={SCOPE_DETAIL_LABELS[SCOPE_3]}>
        <KpiValue value={`${scope3Pct.toFixed(0)}%`} />
        <Progress value={scope3Pct} aria-label={`${SCOPE_3} 비중 ${scope3Pct.toFixed(0)}퍼센트`} />
      </KpiCard>
    </section>
  )
}

function KpiGridSkeleton() {
  return (
    <section
      aria-label="KPI 요약"
      aria-busy="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-muted h-32 animate-pulse rounded-lg" aria-hidden="true" />
      ))}
    </section>
  )
}
