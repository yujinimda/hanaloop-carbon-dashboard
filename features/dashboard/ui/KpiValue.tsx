import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

type KpiValueProps = {
  value: ReactNode
  unit?: ReactNode
  className?: string
  unitClassName?: string
}

export function KpiValue({ value, unit, className, unitClassName }: KpiValueProps) {
  return (
    <div className="flex items-baseline gap-1.5">
      <p
        className={cn(
          'font-sans text-3xl leading-none font-semibold tracking-tight tabular-nums',
          className,
        )}
      >
        {value}
      </p>
      {unit ? (
        <span className={cn('text-muted-foreground text-sm font-medium', unitClassName)}>
          {unit}
        </span>
      ) : null}
    </div>
  )
}
