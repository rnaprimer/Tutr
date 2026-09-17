import { getCurrentUser } from '@/lib/auth/get-current-user'
import { LogoutButton } from '@/components/auth/LogoutButton'
import Link from 'next/link'

export default async function StudentDashboard() {
  const user = await getCurrentUser()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.profile?.display_name}!
        </h1>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Status</h2>
            <p className="text-sm text-gray-600">Your profile is active.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/tutors" className="block w-full rounded-md bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 hover:bg-blue-100">
                Find a Tutor (Placeholder)
              </Link>
              <Link href="/dashboard/student/requests" className="block w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
                My Requests (Placeholder)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
