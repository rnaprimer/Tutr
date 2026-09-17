import { requireAdmin } from '@/lib/auth/require-admin'
import { getTeacherApplication, getTeacherVerificationDocuments } from '@/lib/data/admin-verification'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ReviewActions } from './ReviewActions'
import { DocumentReview } from './DocumentReview'

export default async function TeacherReviewPage({ params }: { params: { id: string } }) {
  await requireAdmin(['SUPER_ADMIN', 'VERIFICATION_ADMIN'])
  
  const application = await getTeacherApplication(params.id)
  
  if (!application.profile || !application.teacherProfile) {
    notFound()
  }

  const documents = await getTeacherVerificationDocuments(params.id)
  const isReviewing = application.teacherProfile.status === 'UNDER_REVIEW'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Teacher Application Review
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Review the teacher&apos;s profile and verification documents.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/admin/teachers"
            className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Back to Queue
          </Link>
        </div>
      </div>

      <div className="mb-6 bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Application Status</h2>
          <p className="text-sm text-gray-500 mt-1">Current state of the teacher&apos;s application.</p>
        </div>
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            application.teacherProfile.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
            application.teacherProfile.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
            application.teacherProfile.status === 'NEEDS_CHANGES' ? 'bg-orange-100 text-orange-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {application.teacherProfile.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {application.teacherProfile.admin_notes && (
        <div className="mb-6 rounded-md bg-yellow-50 p-4 shadow border border-yellow-200">
          <h3 className="text-sm font-medium text-yellow-800">Previous Admin Notes (Needs Changes)</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{application.teacherProfile.admin_notes}</p>
          </div>
        </div>
      )}

      {application.teacherProfile.rejection_reason && (
        <div className="mb-6 rounded-md bg-red-50 p-4 shadow border border-red-200">
          <h3 className="text-sm font-medium text-red-800">Rejection Reason</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{application.teacherProfile.rejection_reason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {/* Basic Information */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{application.profile.display_name || 'Not provided'}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{application.profile.phone_number || 'Not provided'}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Exact Address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{application.profile.exact_address || 'Not provided'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Teaching Information */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Teaching Information</h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Teaching Location Mode</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{application.teacherProfile.teaching_location?.replace('_', ' ') || 'Not provided'}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Bio</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{application.teacherProfile.bio || 'Not provided'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Subjects, Classes, Boards */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Subjects & Classes</h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Subjects</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    application.subjects.map((s: any) => s.name).join(', ') || 'None selected'
                  }
                </dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Classes</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    application.classes.map((c: any) => c.name).join(', ') || 'None selected'
                  }
                </dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Boards</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    application.boards.map((b: any) => b.name).join(', ') || 'None selected'
                  }
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Teaching Areas (Balasore) */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Teaching Areas (Balasore)</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {application.localities.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-900">
                {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  application.localities.map((l: any) => (
                  <li key={l.id}>{l.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">None selected</p>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Pricing</h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Pricing Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{application.teacherProfile.pricing_type?.replace('_', ' ') || 'Not provided'}</dd>
              </div>
              {application.teacherProfile.pricing_type === 'HOURLY' && (
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Hourly Fee</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">₹{application.teacherProfile.hourly_fee}</dd>
                </div>
              )}
              {application.teacherProfile.pricing_type === 'PER_CLASS' && (
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Per Class Fee</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">₹{application.teacherProfile.per_class_fee}</dd>
                </div>
              )}
              {application.teacherProfile.pricing_type === 'MONTHLY' && (
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Monthly Fee</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">₹{application.teacherProfile.monthly_fee}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Availability</h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <ul className="divide-y divide-gray-200">
              {application.availability.length > 0 ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                application.availability.map((slot: any) => (
                  <li key={slot.id} className="py-3 px-6 flex justify-between">
                    <span className="text-sm font-medium text-gray-900">{slot.day_of_week}</span>
                    <span className="text-sm text-gray-500">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)} {slot.is_active ? '(Active)' : '(Inactive)'}</span>
                  </li>
                ))
              ) : (
                <li className="py-4 px-6 text-sm text-gray-500">No availability provided</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Verification Documents */}
      <div className="mb-8 bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Verification Documents</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Identity, qualification, and experience documents. Use short-lived signed URLs to securely view.
            </p>
          </div>
        </div>
        <DocumentReview documents={documents} isReviewing={isReviewing} />
      </div>

      {/* Decision Actions */}
      <div className="mb-8">
        <ReviewActions teacherId={params.id} currentStatus={application.teacherProfile.status} />
      </div>
    </div>
  )
}
