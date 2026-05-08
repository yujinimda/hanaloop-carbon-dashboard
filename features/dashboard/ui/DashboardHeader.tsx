import { ThemeToggle } from './ThemeToggle'

export function DashboardHeader() {
  return (
    <header className="border-border border-b">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">PCF 대시보드</h1>
        <ThemeToggle />
      </div>
    </header>
  )
}
