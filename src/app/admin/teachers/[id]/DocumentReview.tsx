'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateVerificationDocumentStatus } from '@/actions/admin-verification'
import { Database } from '@/types/database'

type DocumentStatus = Database['public']['Enums']['verification_status']

interface DocumentReviewProps {
  documents: {
    id: string
    teacher_id: string
    category: string
    file_path: string
    status: DocumentStatus
    created_at: string
    signed_url: string | null
  }[]
  isReviewing: boolean
}

export function DocumentReview({ documents, isReviewing }: DocumentReviewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = (docId: string, newStatus: DocumentStatus) => {
    setError(null)
    startTransition(async () => {
      const res = await updateVerificationDocumentStatus(docId, newStatus)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  if (documents.length === 0) {
    return <p className="text-sm text-gray-500 py-4 px-6">No verification documents uploaded yet.</p>
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 mx-6 mt-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      <ul role="list" className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between py-4 px-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-900">{doc.category.replace('_', ' ')}</p>
              <p className="text-sm text-gray-500">
                Uploaded: {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-6">
              {doc.signed_url ? (
                <a
                  href={doc.signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View Document
                </a>
              ) : (
                <span className="text-sm text-gray-400">Unavailable</span>
              )}
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 mr-2">Status:</span>
                <select
                  disabled={!isReviewing || isPending}
                  value={doc.status}
                  onChange={(e) => handleStatusChange(doc.id, e.target.value as DocumentStatus)}
                  className={`block rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 border ${doc.status === 'VERIFIED' ? 'bg-green-50 text-green-700' : doc.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}
                >
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="NEEDS_CHANGES">Needs Changes</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
