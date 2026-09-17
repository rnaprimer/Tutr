/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  uploadVerificationDocument,
  deleteVerificationDocument,
  completeDocuments,
} from '@/actions/teacher-onboarding'

interface VerificationDoc {
  id: string
  teacher_id: string
  category: 'IDENTITY' | 'QUALIFICATION' | 'EXPERIENCE'
  file_path: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejection_reason?: string | null
  created_at?: string
}

interface DocumentsUploadSectionProps {
  documents: VerificationDoc[]
}

export function DocumentsUploadSection({ documents }: DocumentsUploadSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const aadharDoc = documents.find((d) => d.category === 'IDENTITY')
  const qualDoc = documents.find((d) => d.category === 'QUALIFICATION')

  const totalUploaded = (aadharDoc ? 1 : 0) + (qualDoc ? 1 : 0)
  const isComplete = totalUploaded === 2

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>, category: 'IDENTITY' | 'QUALIFICATION') => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get('file') as File

    if (!file || file.size === 0) {
      setError('Please select a valid file to upload.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.')
      return
    }

    formData.set('category', category)
    setUploadingCategory(category)

    startTransition(async () => {
      try {
        const res = await uploadVerificationDocument(formData)
        if (res?.error) {
          setError(res.error)
        } else {
          setSuccess(
            category === 'IDENTITY'
              ? 'Aadhaar Card uploaded successfully!'
              : 'Qualification Certificate uploaded successfully!'
          )
          form.reset()
        }
      } catch (err: any) {
        setError(err?.message || 'An unexpected error occurred during upload.')
      } finally {
        setUploadingCategory(null)
      }
    })
  }

  const handleDelete = (docId: string, filePath: string) => {
    setError(null)
    setSuccess(null)
    setDeletingId(docId)

    const formData = new FormData()
    formData.set('id', docId)
    formData.set('file_path', filePath)

    startTransition(async () => {
      try {
        const res = await deleteVerificationDocument(formData)
        if (res?.error) {
          setError(res.error)
        } else {
          setSuccess('Document removed successfully.')
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to remove document.')
      } finally {
        setDeletingId(null)
      }
    })
  }

  const handleContinue = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isComplete) {
      e.preventDefault()
      setError('Please upload both your Aadhaar Card and Qualification Certificate before proceeding.')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Step 7: Verification Documents</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            We require two mandatory documents to verify identity and maintain tutoring standards.
          </p>
        </div>
        <div className="flex items-center">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              isComplete
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {totalUploaded} of 2 Uploaded {isComplete && '✓'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-start gap-2.5">
          <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1 font-medium">{success}</div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 text-sm">✕</button>
        </div>
      )}

      <div className="space-y-6">
        {/* DOCUMENT 1: AADHAAR CARD IDENTIFICATION */}
        <div className={`p-5 rounded-2xl border transition-all ${
          aadharDoc ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                aadharDoc ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">1. Aadhaar Card Identification</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Mandatory</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-xl">
                  Upload your Aadhaar Card (front & back, or e-Aadhaar PDF) to verify identity. Keeps your tutoring profile verified and trustworthy.
                </p>
              </div>
            </div>

            <div>
              {aadharDoc ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  ✓ Uploaded
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Pending Upload
                </span>
              )}
            </div>
          </div>

          {aadharDoc ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border border-emerald-200/80 gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="truncate">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {aadharDoc.file_path.split('/').pop()}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Status: <span className="font-medium text-gray-600">{aadharDoc.status}</span>
                  </p>
                  {aadharDoc.status === 'REJECTED' && (
                    <p className="text-xs text-red-600 font-medium mt-0.5">
                      Rejected: {aadharDoc.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={deletingId === aadharDoc.id}
                onClick={() => handleDelete(aadharDoc.id, aadharDoc.file_path)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {deletingId === aadharDoc.id ? 'Removing...' : 'Remove & Replace'}
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => handleUpload(e, 'IDENTITY')} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Aadhaar file (PDF, JPG, PNG, max 5MB)
                </label>
                <input
                  type="file"
                  name="file"
                  required
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg p-1.5 bg-white cursor-pointer"
                />
              </div>
              <button
                type="submit"
                disabled={uploadingCategory === 'IDENTITY' || isPending}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs flex-shrink-0 flex items-center justify-center gap-1.5"
              >
                {uploadingCategory === 'IDENTITY' ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload Aadhaar Card'
                )}
              </button>
            </form>
          )}
        </div>

        {/* DOCUMENT 2: QUALIFICATION CERTIFICATE */}
        <div className={`p-5 rounded-2xl border transition-all ${
          qualDoc ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                qualDoc ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">2. Qualification Certificate</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Mandatory</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-xl">
                  Upload your highest educational certificate, degree diploma, or marksheet. Proves your academic credentials to parents and students.
                </p>
              </div>
            </div>

            <div>
              {qualDoc ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  ✓ Uploaded
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Pending Upload
                </span>
              )}
            </div>
          </div>

          {qualDoc ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border border-emerald-200/80 gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="truncate">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {qualDoc.file_path.split('/').pop()}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Status: <span className="font-medium text-gray-600">{qualDoc.status}</span>
                  </p>
                  {qualDoc.status === 'REJECTED' && (
                    <p className="text-xs text-red-600 font-medium mt-0.5">
                      Rejected: {qualDoc.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={deletingId === qualDoc.id}
                onClick={() => handleDelete(qualDoc.id, qualDoc.file_path)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {deletingId === qualDoc.id ? 'Removing...' : 'Remove & Replace'}
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => handleUpload(e, 'QUALIFICATION')} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Certificate file (PDF, JPG, PNG, max 5MB)
                </label>
                <input
                  type="file"
                  name="file"
                  required
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg p-1.5 bg-white cursor-pointer"
                />
              </div>
              <button
                type="submit"
                disabled={uploadingCategory === 'QUALIFICATION' || isPending}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs flex-shrink-0 flex items-center justify-center gap-1.5"
              >
                {uploadingCategory === 'QUALIFICATION' ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload Qualification Certificate'
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-gray-200 flex items-center justify-between">
        <Link
          href="/dashboard/teacher/onboarding/availability"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Back
        </Link>
        <form action={completeDocuments as any} onSubmit={handleContinue}>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-xs"
          >
            Continue to Review
          </button>
        </form>
      </div>
    </div>
  )
}
