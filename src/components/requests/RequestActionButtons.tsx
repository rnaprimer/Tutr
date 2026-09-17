'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  cancelTutorRequest,
  acceptTutorRequest,
  declineTutorRequest,
  completeTutorRequest,
} from '@/actions/tutor-requests'
import { RequestStatus } from '@/lib/data/tutor-requests'

interface CancelButtonProps {
  requestId: string
  currentStatus: RequestStatus
  isTeacher?: boolean
}

export function CancelRequestButton({
  requestId,
  currentStatus,
  isTeacher = false,
}: CancelButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Teachers cannot cancel PENDING requests (must decline)
  if (isTeacher && currentStatus === 'PENDING') {
    return null
  }

  // Only PENDING and ACCEPTED can be cancelled
  if (currentStatus !== 'PENDING' && currentStatus !== 'ACCEPTED') {
    return null
  }

  const handleCancel = async () => {
    const confirmText =
      currentStatus === 'ACCEPTED'
        ? 'Are you sure you want to cancel this active tutoring engagement?'
        : 'Are you sure you want to cancel this request?'

    if (!window.confirm(confirmText)) {
      return
    }

    setLoading(true)
    setError(null)
    const res = await cancelTutorRequest(requestId)
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
      >
        {loading ? 'Cancelling...' : currentStatus === 'ACCEPTED' ? 'Cancel Engagement' : 'Cancel Request'}
      </button>
    </div>
  )
}

interface TeacherActionsProps {
  requestId: string
  currentStatus: RequestStatus
}

export function TeacherRequestActions({
  requestId,
  currentStatus,
}: TeacherActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (currentStatus !== 'PENDING' && currentStatus !== 'ACCEPTED') {
    return null
  }

  const handleAccept = async () => {
    if (!window.confirm('Accept this tutor request? You will be connected with the student/parent.')) {
      return
    }
    setLoading(true)
    setError(null)
    const res = await acceptTutorRequest(requestId)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      router.refresh()
    }
  }

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this tutor request?')) {
      return
    }
    setLoading(true)
    setError(null)
    const res = await declineTutorRequest(requestId)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      router.refresh()
    }
  }

  const handleComplete = async () => {
    if (!window.confirm('Mark this tutoring engagement as completed?')) {
      return
    }
    setLoading(true)
    setError(null)
    const res = await completeTutorRequest(requestId)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-3 items-center">
        {currentStatus === 'PENDING' && (
          <>
            <button
              type="button"
              onClick={handleAccept}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Accept Request'}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Decline'}
            </button>
          </>
        )}

        {currentStatus === 'ACCEPTED' && (
          <>
            <button
              type="button"
              onClick={handleComplete}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Mark as Completed'}
            </button>
            <CancelRequestButton
              requestId={requestId}
              currentStatus={currentStatus}
              isTeacher={true}
            />
          </>
        )}
      </div>
    </div>
  )
}
