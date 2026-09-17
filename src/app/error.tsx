'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Something went wrong!</h2>
      <p className="mb-8 text-gray-600 max-w-md">
        We encountered an unexpected error. Please try again.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try again
        </button>
        <Link 
          href="/"
          className="rounded-md bg-gray-100 px-4 py-2 text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}
