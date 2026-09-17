import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData, calculateProfileCompleteness } from '@/lib/data/teacher-profile'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader'

const steps = [
  { id: 'basic-info', name: '01 - Basic Info', title: 'Basic Information' },
  { id: 'teaching-info', name: '02 - Teaching', title: 'Teaching Information' },
  { id: 'subjects-classes', name: '03 - Subjects & Classes', title: 'Subjects & Classes' },
  { id: 'teaching-areas', name: '04 - Areas', title: 'Teaching Areas' },
  { id: 'pricing', name: '05 - Pricing', title: 'Pricing' },
  { id: 'availability', name: '06 - Availability', title: 'Availability' },
  { id: 'documents', name: '07 - Documents', title: 'Verification Documents' },
  { id: 'review', name: '08 - Review', title: 'Review & Submit' },
]

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'TEACHER') redirect('/')

  const data = await getTeacherOnboardingData(user.id)
  const completeness = calculateProfileCompleteness(data)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <OnboardingHeader steps={steps} completenessPercentage={completeness.percentage} />

      <div className="bg-white shadow rounded-lg p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}
