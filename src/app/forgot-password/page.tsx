'use client'

import { useActionState } from 'react'
import { forgotPassword } from '@/actions/auth'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a password reset link.
          </p>
        </div>
        
        {state?.success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{state.success}</div>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" action={formAction}>
            {state?.error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{state.error}</div>
              </div>
            )}
            
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {isPending ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </div>
            
            <div className="text-center text-sm">
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
