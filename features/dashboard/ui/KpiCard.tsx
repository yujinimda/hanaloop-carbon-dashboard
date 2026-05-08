import type { ReactNode } from 'react'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'

type KpiCardProps = {
  label: string
  caption: string
  emph?: boolean
  children: ReactNode
}

export function KpiCard({ label, caption, emph = false, children }: KpiCardProps) {
  return (
    <Card className={cn('gap-3 p-4', emph && 'bg-primary text-primary-foreground ring-0')}>
      <p
        className={cn(
          'text-sm font-medium',
          emph ? 'text-primary-foreground/70' : 'text-muted-foreground',
        )}
      >
        {label}
      </p>
      {children}
      <p className={cn('text-xs', emph ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
        {caption}
      </p>
    </Card>
  )
}
