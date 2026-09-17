import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData, calculateProfileCompleteness } from '@/lib/data/teacher-profile'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

const steps = [
  { id: 'basic-info', name: '01 - Basic Info' },
  { id: 'teaching-info', name: '02 - Teaching' },
  { id: 'subjects-classes', name: '03 - Subjects & Classes' },
  { id: 'teaching-areas', name: '04 - Areas' },
  { id: 'pricing', name: '05 - Pricing' },
  { id: 'availability', name: '06 - Availability' },
  { id: 'documents', name: '07 - Documents' },
  { id: 'review', name: '08 - Review' },
]

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'TEACHER') redirect('/')

  const data = await getTeacherOnboardingData(user.id)
  const completeness = calculateProfileCompleteness(data)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Teacher Onboarding</h1>
          <Link href="/dashboard/teacher" className="text-sm font-medium text-gray-500 hover:text-gray-900">
            Exit
          </Link>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Profile Completion</span>
          <span className="font-medium">{completeness.percentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${completeness.percentage}%` }}></div>
        </div>

        <div className="hidden sm:flex mt-4 space-x-2 overflow-x-auto pb-2">
          {steps.map((step) => (
            <Link 
              key={step.id} 
              href={`/dashboard/teacher/onboarding/${step.id}`}
              className="px-3 py-1 text-xs rounded-full whitespace-nowrap bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              {step.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}
