'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

function SignupForm() {
  const searchParams = useSearchParams()
  const rawRole = searchParams.get('role')?.toUpperCase()
  const isFixedRole = rawRole === 'TEACHER' || rawRole === 'STUDENT' || rawRole === 'PARENT'
  const [selectedRole, setSelectedRole] = useState<string>(isFixedRole ? rawRole : 'STUDENT')

  // Explicitly reject administrative roles
  if (rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50/60 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-600">
            Administrative accounts cannot be registered through public registration.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const effectiveRole = isFixedRole ? rawRole : selectedRole

  let heading = 'Join Tutr'
  let subtitle = 'Select your role to get started with Google'

  if (effectiveRole === 'TEACHER') {
    heading = 'Join Tutr as a Tutor'
    subtitle = 'Create your tutor account and start connecting with students in Balasore.'
  } else if (effectiveRole === 'STUDENT') {
    heading = 'Join Tutr as a Student'
    subtitle = 'Create your student account to discover and request verified tutors in Balasore.'
  } else if (effectiveRole === 'PARENT') {
    heading = 'Join Tutr as a Parent'
    subtitle = 'Create your parent account to find and manage tutoring for your children in Balasore.'
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50/60 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div>
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl mb-4">
            T
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {heading}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {subtitle}
          </p>
        </div>

        {/* If no fixed role parameter provided, allow selecting role chips */}
        {!isFixedRole && (
          <div className="text-left space-y-2 pt-2">
            <label className="block text-xs font-semibold text-gray-700">I am joining as a:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'STUDENT', label: 'Student' },
                { id: 'PARENT', label: 'Parent' },
                { id: 'TEACHER', label: 'Tutor' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    effectiveRole === r.id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3">
          <GoogleSignInButton role={effectiveRole} mode="signup" />
        </div>

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          Instant 1-click registration. No passwords required.
        </div>

        <div className="text-center text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
