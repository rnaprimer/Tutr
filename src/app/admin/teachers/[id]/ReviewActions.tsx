'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { startTeacherReview, verifyTeacher, requestTeacherChanges, rejectTeacher } from '@/actions/admin-verification'

interface ReviewActionsProps {
  teacherId: string
  currentStatus: string
}

export function ReviewActions({ teacherId, currentStatus }: ReviewActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [actionType, setActionType] = useState<'NONE' | 'REQUEST_CHANGES' | 'REJECT'>('NONE')
  const [notes, setNotes] = useState('')

  const handleStartReview = () => {
    setError(null)
    startTransition(async () => {
      const res = await startTeacherReview(teacherId)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  const handleVerify = () => {
    if (!confirm('Are you sure you want to verify this teacher? They will become publicly visible.')) return
    
    setError(null)
    startTransition(async () => {
      const res = await verifyTeacher(teacherId)
      if (res.error) {
        if (res.missing) {
          setError(`Verification failed. Missing requirements: ${res.missing.join(', ')}`)
        } else {
          setError(res.error)
        }
      }
      else router.refresh()
    })
  }

  const handleActionSubmit = () => {
    if (actionType === 'NONE') return
    
    setError(null)
    startTransition(async () => {
      let res
      if (actionType === 'REQUEST_CHANGES') {
        res = await requestTeacherChanges(teacherId, notes)
      } else {
        res = await rejectTeacher(teacherId, notes)
      }
      
      if (res?.error) setError(res.error)
      else {
        setActionType('NONE')
        setNotes('')
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Decision</h3>
      
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {currentStatus === 'SUBMITTED' && (
        <div className="mt-5">
          <p className="text-sm text-gray-500 mb-4">You must start the review process before you can approve, request changes, or reject the application.</p>
          <button
            onClick={handleStartReview}
            disabled={isPending}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? 'Starting...' : 'Start Review'}
          </button>
        </div>
      )}

      {currentStatus === 'UNDER_REVIEW' && actionType === 'NONE' && (
        <div className="mt-5 flex gap-4">
          <button
            onClick={() => setActionType('REQUEST_CHANGES')}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Request Changes
          </button>
          
          <button
            onClick={() => setActionType('REJECT')}
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Reject Application
          </button>
          
          <div className="flex-1"></div>
          
          <button
            onClick={handleVerify}
            disabled={isPending}
            className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? 'Processing...' : 'Verify Teacher'}
          </button>
        </div>
      )}

      {(actionType === 'REQUEST_CHANGES' || actionType === 'REJECT') && (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              {actionType === 'REQUEST_CHANGES' ? 'Admin Notes (Sent to Teacher)' : 'Rejection Reason (Sent to Teacher)'}
            </label>
            <div className="mt-1">
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder={`Please provide a ${actionType === 'REQUEST_CHANGES' ? 'note explaining what needs to change' : 'reason for rejection'}...`}
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleActionSubmit}
              disabled={isPending || !notes.trim()}
              className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${actionType === 'REQUEST_CHANGES' ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
            >
              {isPending ? 'Submitting...' : (actionType === 'REQUEST_CHANGES' ? 'Submit Change Request' : 'Submit Rejection')}
            </button>
            <button
              onClick={() => setActionType('NONE')}
              disabled={isPending}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {['VERIFIED', 'NEEDS_CHANGES', 'REJECTED', 'SUSPENDED'].includes(currentStatus) && (
        <div className="mt-5">
          <p className="text-sm text-gray-500">
            This application is currently <span className="font-semibold text-gray-900">{currentStatus}</span>. 
            No further actions can be taken in the normal verification flow at this stage.
          </p>
        </div>
      )}
    </div>
  )
}
