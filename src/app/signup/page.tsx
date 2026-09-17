'use client'

import { useActionState, Suspense } from 'react'
import { signup } from '@/actions/auth'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, null)
  const searchParams = useSearchParams()
  const rawRole = searchParams.get('role')?.toUpperCase()

  // 1. Explicitly reject administrative roles
  if (rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
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
              className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Determine role metadata and headings
  const isFixedRole = rawRole === 'TEACHER' || rawRole === 'STUDENT' || rawRole === 'PARENT'
  const targetRole = isFixedRole ? rawRole : undefined

  let heading = 'Join Tutr'
  let subtitle = 'Sign up to find or become a tutor in Balasore'

  if (targetRole === 'TEACHER') {
    heading = 'Join Tutr as a Tutor'
    subtitle = 'Create your tutor account and start connecting with students in Balasore.'
  } else if (targetRole === 'STUDENT') {
    heading = 'Join Tutr as a Student'
    subtitle = 'Create your student account to discover and request verified tutors in Balasore.'
  } else if (targetRole === 'PARENT') {
    heading = 'Join Tutr as a Parent'
    subtitle = 'Create your parent account to find and manage tutoring for your children in Balasore.'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            {heading}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {subtitle}
          </p>
        </div>

        {/* Google OAuth Option */}
        <div className="mt-6">
          <GoogleSignInButton role={targetRole} mode="signup" />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-gray-500 font-medium">OR</span>
          </div>
        </div>

        <form className="space-y-6" action={formAction}>
          {state?.error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{state.error}</div>
            </div>
          )}

          {/* Hidden fixed role input (UI helper; validated strictly on server) */}
          {isFixedRole ? (
            <input type="hidden" name="role" value={targetRole} />
          ) : (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">I am a...</label>
              <select
                id="role"
                name="role"
                required
                defaultValue="STUDENT"
                className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white"
              >
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
                <option value="TEACHER">Teacher</option>
              </select>
            </div>
          )}
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {isPending ? 'Signing up...' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
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
