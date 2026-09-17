'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { logout } from '@/actions/auth'
import { createClient } from '@/lib/supabase/client'

interface UserSummary {
  id: string
  email?: string
  displayName?: string | null
  role?: string | null
  isAdmin?: boolean
  avatarUrl?: string | null
}

interface HeaderAuthControlsProps {
  user: UserSummary | null
}

export function HeaderAuthControls({ user }: HeaderAuthControlsProps) {
  const [isLoggingOut, startLogoutTransition] = useTransition()
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true)
      const supabase = createClient()
      const origin = window.location.origin
      const callbackUrl = new URL(`${origin}/auth/callback`)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        console.error('Google sign in error:', error)
        setIsSigningIn(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Failed to trigger Google sign in:', err)
      setIsSigningIn(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSigningIn}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
        >
          {isSigningIn ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fillOpacity="0.95"
                />
                <path
                  fill="#currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fillOpacity="0.95"
                />
                <path
                  fill="#currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fillOpacity="0.95"
                />
                <path
                  fill="#currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fillOpacity="0.95"
                />
              </svg>
              <span>Login with Google</span>
            </>
          )}
        </button>
      </div>
    )
  }

  // Determine user dashboard target
  let dashboardHref = '/dashboard/student'
  let roleLabel = 'Student'
  let roleBadgeColor = 'bg-gray-100 text-gray-700'

  if (user.isAdmin || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    dashboardHref = '/admin/teachers'
    roleLabel = 'Admin'
    roleBadgeColor = 'bg-purple-100 text-purple-800 border-purple-200'
  } else if (user.role === 'TEACHER') {
    dashboardHref = '/dashboard/teacher'
    roleLabel = 'Tutor'
    roleBadgeColor = 'bg-blue-100 text-blue-800 border-blue-200'
  } else if (user.role === 'PARENT') {
    dashboardHref = '/dashboard/parent'
    roleLabel = 'Parent'
    roleBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Link
        href={dashboardHref}
        className="flex items-center gap-2 hover:opacity-85 transition-opacity"
      >
        <div className="flex flex-col text-right hidden sm:block">
          <span className="text-xs font-semibold text-gray-900 max-w-[140px] truncate leading-tight">
            {user.displayName || user.email || 'User'}
          </span>
          <span className={`inline-block self-end text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleBadgeColor}`}>
            {roleLabel}
          </span>
        </div>

        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.displayName || 'Avatar'}
            className="w-8 h-8 rounded-full border border-gray-200 object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {(user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
        )}
      </Link>

      <button
        type="button"
        onClick={() => startLogoutTransition(() => logout())}
        disabled={isLoggingOut}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 shadow-xs"
      >
        {isLoggingOut ? 'Logging out...' : 'Log out'}
      </button>
    </div>
  )
}
