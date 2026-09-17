'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Step {
  id: string
  name: string
  title: string
}

interface OnboardingHeaderProps {
  steps: Step[]
  completenessPercentage: number
}

export function OnboardingHeader({ steps, completenessPercentage }: OnboardingHeaderProps) {
  const pathname = usePathname()

  // Determine current step from pathname
  const currentStepIndex = steps.findIndex((step) => pathname.includes(step.id))
  const safeCurrentIndex = currentStepIndex >= 0 ? currentStepIndex : 0
  const currentStep = steps[safeCurrentIndex]

  // Calculate step progress: e.g. on step 3 of 8, progress is at least 38%
  const stepProgress = Math.round(((safeCurrentIndex + 1) / steps.length) * 100)
  const displayProgress = Math.max(stepProgress, completenessPercentage)

  return (
    <div className="mb-8">
      {/* Top title & exit */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Onboarding</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Step {safeCurrentIndex + 1} of {steps.length}: <span className="font-semibold text-gray-900">{currentStep?.title}</span>
          </p>
        </div>
        <Link
          href="/dashboard/teacher"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors"
        >
          Exit to Dashboard
        </Link>
      </div>

      {/* Progress bar text */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <span className="font-medium text-gray-700">Onboarding Progress</span>
        <span className="font-bold text-blue-600">{displayProgress}% Complete</span>
      </div>

      {/* Progress bar line */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out shadow"
          style={{ width: `${displayProgress}%` }}
        />
      </div>

      {/* Step navigation pills */}
      <div className="flex mt-4 space-x-2 overflow-x-auto pb-2 scrollbar-thin">
        {steps.map((step, idx) => {
          const isActive = idx === safeCurrentIndex
          const isCompleted = idx < safeCurrentIndex

          let pillClasses = 'px-3 py-1 text-xs rounded-full whitespace-nowrap transition-all '
          if (isActive) {
            pillClasses += 'bg-blue-600 text-white font-semibold shadow-sm ring-2 ring-blue-600 ring-offset-2'
          } else if (isCompleted) {
            pillClasses += 'bg-blue-50 text-blue-700 font-medium border border-blue-200 hover:bg-blue-100'
          } else {
            pillClasses += 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }

          return (
            <Link key={step.id} href={`/dashboard/teacher/onboarding/${step.id}`} className={pillClasses}>
              {isCompleted && (
                <span className="inline-block mr-1 text-blue-600 font-bold">✓</span>
              )}
              {step.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
