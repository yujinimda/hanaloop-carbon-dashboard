'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/shared/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // next-themes recommends gating icon swap on a client-only mount flag to
  // avoid hydration mismatch when the resolved theme differs from the SSR
  // default. The setState-in-effect is intentional here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'
  const next = isDark ? 'light' : 'dark'

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={mounted ? `${next === 'dark' ? '다크' : '라이트'} 모드로 전환` : '테마 전환'}
      onClick={() => setTheme(next)}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
