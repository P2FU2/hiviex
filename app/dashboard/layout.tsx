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
        <div className="flex">
          <DashboardSidebar />
          <main className="flex-1 p-6 sm:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardProviders>
  )
}

