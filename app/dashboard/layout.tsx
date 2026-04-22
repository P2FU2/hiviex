/**
 * Dashboard Layout
 * 
 * Main layout for all dashboard pages with sidebar navigation
 */

import { getAuthSession } from '@/lib/auth/session'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/Header'
import DashboardProviders from '@/components/dashboard/DashboardProviders'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await getAuthSession()

  return (
    <DashboardProviders>
      <div className="dashboard-app min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)]">
        <DashboardHeader />
        <div className="flex flex-col sm:flex-row">
          <DashboardSidebar />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardProviders>
  )
}

