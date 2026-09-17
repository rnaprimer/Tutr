import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getMyStudents } from '@/actions/students'
import { LogoutButton } from '@/components/auth/LogoutButton'
import AddStudentForm from './AddStudentForm'
import Link from 'next/link'

export default async function ParentDashboard() {
  const user = await getCurrentUser()
  const students = await getMyStudents()

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
            <h2 className="text-lg font-medium text-gray-900 mb-4">My Students ({students.length})</h2>
            {students.length === 0 ? (
              <p className="text-sm text-gray-500">You haven&apos;t added any students yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {students.map((student: { id: string, name: string }) => (
                  <li key={student.id} className="py-3 text-sm font-medium text-gray-900">
                    {student.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <AddStudentForm />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/tutors" className="block w-full rounded-md bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 hover:bg-blue-100">
                Find a Tutor
              </Link>
              <Link href="/dashboard/parent/requests" className="block w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
                My Requests (Placeholder)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
