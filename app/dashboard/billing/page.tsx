/**
 * Billing Page
 * 
 * Placeholder for billing (to be implemented)
 */

import { getAuthSession } from '@/lib/auth/session'
import { CreditCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const session = await getAuthSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Billing
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your subscription and billing
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Billing feature coming soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Stripe integration will be available here
        </p>
      </div>
    </div>
  )
}

