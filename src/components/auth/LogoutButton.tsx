'use client'

import { useTransition } from 'react'
import { logout } from '@/actions/auth'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-300 disabled:opacity-50"
    >
      {isPending ? 'Logging out...' : 'Log out'}
    </button>
  )
}
