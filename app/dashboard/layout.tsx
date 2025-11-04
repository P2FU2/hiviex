/**
 * Dashboard Layout
 * 
 * Main layout for all dashboard pages with sidebar navigation
 */

import { getAuthSession } from '@/lib/auth/session'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

