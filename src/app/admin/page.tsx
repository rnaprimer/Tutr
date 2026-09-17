import { getCurrentUser } from '@/lib/auth/get-current-user'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { getDashboardStats } from '@/lib/data/admin-verification'
import Link from 'next/link'

export default async function AdminDashboard() {
  const user = await getCurrentUser()
  const stats = await getDashboardStats()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Admin Portal
        </h1>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg bg-white p-6 shadow border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
          <p className="text-sm text-gray-600">
            Logged in as <span className="font-semibold text-gray-900">{user?.admin?.role}</span>.
          </p>
          <div className="mt-6">
            <Link 
              href="/admin/teachers"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Teacher Verification Queue
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Verification Statistics</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Submitted</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats['SUBMITTED'] || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Under Review</dt>
              <dd className="mt-1 text-2xl font-semibold text-blue-600">{stats['UNDER_REVIEW'] || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Needs Changes</dt>
              <dd className="mt-1 text-2xl font-semibold text-orange-600">{stats['NEEDS_CHANGES'] || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Verified</dt>
              <dd className="mt-1 text-2xl font-semibold text-green-600">{stats['VERIFIED'] || 0}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
