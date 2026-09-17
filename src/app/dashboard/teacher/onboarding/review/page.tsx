/* eslint-disable @typescript-eslint/no-explicit-any */

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData, calculateProfileCompleteness } from '@/lib/data/teacher-profile'
import { submitTeacherForVerification } from '@/actions/teacher-onboarding'
import Link from 'next/link'

export default async function ReviewPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)
  const completeness = calculateProfileCompleteness(data)

  const isDraftOrNeedsChanges = ['DRAFT', 'NEEDS_CHANGES'].includes(data.teacherProfile.status)

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 8: Review & Submit</h2>
      
      {!completeness.isReadyForSubmission ? (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-sm font-medium text-red-800 mb-2">Profile Incomplete ({completeness.percentage}%)</h3>
          <p className="text-sm text-red-700 mb-3">You must complete all required fields before submitting your profile for verification.</p>
          <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
            {completeness.missingFields.map((field, i) => (
              <li key={i}>{field}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-sm font-medium text-green-800 mb-1">Profile Complete!</h3>
          <p className="text-sm text-green-700">Your profile is ready to be submitted for verification.</p>
        </div>
      )}

      <div className="space-y-6 mb-8">
        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-3">1. Basic Information</h3>
          <p className="text-sm"><span className="text-gray-500 w-32 inline-block">Name:</span> {data.basicInfo.display_name}</p>
          <p className="text-sm"><span className="text-gray-500 w-32 inline-block">Phone:</span> {data.basicInfo.phone_number}</p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-3">2. Teaching Information</h3>
          <p className="text-sm"><span className="text-gray-500 w-32 inline-block">Location:</span> {data.teacherProfile.teaching_location}</p>
          <p className="text-sm mt-1"><span className="text-gray-500 w-32 inline-block align-top">Bio:</span> <span className="inline-block max-w-lg">{data.teacherProfile.bio}</span></p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-3">3. Subjects & Classes</h3>
          <p className="text-sm"><span className="text-gray-500 w-32 inline-block">Subjects:</span> {data.subjects.length} selected</p>
          <p className="text-sm"><span className="text-gray-500 w-32 inline-block">Classes:</span> {data.classes.length} selected</p>
          <p className="text-sm"><span className="text-gray-500 w-32 inline-block">Boards:</span> {data.boards.length} selected</p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-3">4. Teaching Areas</h3>
          <p className="text-sm"><span className="text-gray-500 w-32 inline-block">Localities:</span> {data.localities.length} selected</p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-3">5. Pricing & Availability</h3>
          <p className="text-sm"><span className="text-gray-500 w-32 inline-block">Pricing Model:</span> {data.teacherProfile.pricing_type}</p>
          <p className="text-sm mt-1"><span className="text-gray-500 w-32 inline-block">Availability:</span> {data.availability.length} slots</p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-3">6. Verification Documents</h3>
          <p className="text-sm mb-2 text-gray-500 italic">Documents remain private and are only visible to admins.</p>
          <ul className="text-sm space-y-1">
            {data.documents.map((doc: any) => {
              const label =
                doc.category === 'IDENTITY'
                  ? 'Aadhaar Card Identification'
                  : doc.category === 'QUALIFICATION'
                  ? 'Qualification Certificate'
                  : doc.category
              return (
                <li key={doc.id}>
                  - <strong className="font-medium text-gray-800">{label}:</strong>{' '}
                  <span className="text-gray-600">{doc.file_path.split('/').pop()}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <Link href="/dashboard/teacher/onboarding/documents" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
          Back
        </Link>
        
        {isDraftOrNeedsChanges ? (
          <form action={submitTeacherForVerification as any}>
            <button 
              type="submit" 
              disabled={!completeness.isReadyForSubmission}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              Submit for Verification
            </button>
          </form>
        ) : (
          <Link href="/dashboard/teacher" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Return to Dashboard
          </Link>
        )}
      </div>
    </div>
  )
}
