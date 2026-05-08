import { DashboardHeader } from '@/features/dashboard/ui/DashboardHeader'
import { KpiGrid } from '@/features/dashboard/ui/KpiGrid'

export default function DashboardPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <DashboardHeader />
      <main className="mx-auto max-w-screen-xl px-6 py-8">
        <KpiGrid />
      </main>
    </div>
  )
}
