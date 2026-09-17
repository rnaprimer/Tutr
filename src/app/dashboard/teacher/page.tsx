import { getCurrentUser } from '@/lib/auth/get-current-user'
import { LogoutButton } from '@/components/auth/LogoutButton'
import Link from 'next/link'
import { getTeacherOnboardingData, calculateProfileCompleteness } from '@/lib/data/teacher-profile'

export default async function TeacherDashboard() {
  const user = await getCurrentUser()
  if (!user) return null

  const onboardingData = await getTeacherOnboardingData(user.id)
  const completeness = calculateProfileCompleteness(onboardingData)
  const status = onboardingData.teacherProfile.status

  const statusDisplay: Record<string, string> = {
    DRAFT: 'Complete your profile',
    SUBMITTED: 'Your profile has been submitted.',
    UNDER_REVIEW: 'Your profile is currently under review.',
    NEEDS_CHANGES: 'Changes are required before verification.',
    VERIFIED: 'Your profile is verified.',
    REJECTED: 'Your application was rejected.',
    SUSPENDED: 'Your account is currently suspended.'
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'text-gray-600',
    SUBMITTED: 'text-blue-600',
    UNDER_REVIEW: 'text-blue-600',
    NEEDS_CHANGES: 'text-orange-600',
    VERIFIED: 'text-green-600',
    REJECTED: 'text-red-600',
    SUSPENDED: 'text-red-600'
  }

  const displayString = statusDisplay[status] || 'Unknown status'
  const colorString = statusColors[status] || 'text-gray-600'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.profile?.display_name || 'Teacher'}!
        </h1>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Verification Status</h2>
            <p className={`text-sm font-medium ${colorString}`}>{status}</p>
            <p className="text-sm text-gray-500 mt-2">{displayString}</p>
            
            {status === 'NEEDS_CHANGES' && onboardingData.teacherProfile.admin_notes && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                <h3 className="text-sm font-medium text-orange-800">Admin Feedback:</h3>
                <p className="mt-1 text-sm text-orange-700">{onboardingData.teacherProfile.admin_notes}</p>
              </div>
            )}
            
            {status === 'REJECTED' && onboardingData.teacherProfile.rejection_reason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800">Rejection Reason:</h3>
                <p className="mt-1 text-sm text-red-700">{onboardingData.teacherProfile.rejection_reason}</p>
              </div>
            )}

            {status !== 'VERIFIED' && (
              <p className="text-xs text-gray-400 mt-4">
                You will not be visible to students until your profile is complete and verified.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Onboarding Progress</h2>
            
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Profile completion</span>
              <span className="text-sm font-medium text-gray-700">{completeness.percentage}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${completeness.percentage}%` }}></div>
            </div>

            <div className="space-y-3">
              {['DRAFT', 'NEEDS_CHANGES'].includes(status) && (
                <Link href={completeness.nextAction || '/dashboard/teacher/onboarding/basic-info'} className="block w-full rounded-md bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-700">
                  {completeness.percentage === 0 ? 'Complete your teacher profile' : 'Continue Profile'}
                </Link>
              )}
              {['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(status) && (
                <Link href="/dashboard/teacher/onboarding/review" className="block w-full rounded-md bg-gray-100 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-200">
                  View Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
