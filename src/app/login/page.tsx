'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

function LoginForm() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const errorParam = searchParams.get('error')

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50/60 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div>
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl mb-4">
            T
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome to Tutr
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in with your Google account to access your dashboard.
          </p>
        </div>

        {errorParam && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-left">
            <div className="text-sm font-medium text-red-700">{errorParam}</div>
          </div>
        )}

        {message && (
          <div className="rounded-xl bg-green-50 p-4 border border-green-200 text-left">
            <div className="text-sm font-medium text-green-700">{message}</div>
          </div>
        )}

        <div className="pt-2">
          <GoogleSignInButton mode="login" />
        </div>

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          Tutors, students, parents, and administrators sign in securely via Google OAuth.
        </div>

        <div className="text-center text-sm">
          <Link href="/signup?role=TEACHER" className="font-medium text-blue-600 hover:text-blue-700">
            Want to teach? Join as a Tutor
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
