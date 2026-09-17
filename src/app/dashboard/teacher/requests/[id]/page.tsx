import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getRequestDetails } from '@/lib/data/tutor-requests'
import { RequestStatusBadge } from '@/components/requests/RequestStatusBadge'
import { TeacherRequestActions } from '@/components/requests/RequestActionButtons'
import { getTeachingLocationLabel } from '@/lib/utils/teaching-location'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function TeacherRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const req = await getRequestDetails(id)

  if (!req) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/dashboard/teacher/requests"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1"
        >
          &larr; Back to Incoming Requests
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500">
                Request ID: <span className="font-mono">{req.id.slice(0, 8)}...</span>
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                Received on {new Date(req.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {req.subject?.name || 'Tuition'} for {req.class?.name || 'Student'} ({req.board?.name || ''})
            </h1>
          </div>
          <div className="flex flex-col sm:items-end gap-3">
            <RequestStatusBadge status={req.status} />
            <TeacherRequestActions requestId={req.id} currentStatus={req.status} />
          </div>
        </div>

        {/* Status Explanation Banner */}
        <div className="mt-6 p-4 rounded-lg text-sm bg-gray-50 border border-gray-200">
          {req.status === 'PENDING' && (
            <p className="text-amber-800">
              <span className="font-semibold">Action Needed:</span> Please review the requirements, schedule, and location below. You can choose to accept or decline this request.
            </p>
          )}
          {req.status === 'ACCEPTED' && (
            <p className="text-green-800">
              <span className="font-semibold">Active Engagement:</span> You have accepted this request. Classes should proceed according to the agreed schedule. Once tutoring is finished, you can mark it as completed.
            </p>
          )}
          {req.status === 'DECLINED' && (
            <p className="text-gray-700">
              <span className="font-semibold">Request Declined:</span> You declined this tutor request.
            </p>
          )}
          {req.status === 'CANCELLED' && (
            <p className="text-red-700">
              <span className="font-semibold">Request Cancelled:</span> This request has been cancelled.
            </p>
          )}
          {req.status === 'COMPLETED' && (
            <p className="text-blue-800">
              <span className="font-semibold">Engagement Completed:</span> This tutoring engagement has concluded.
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Academic Info */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Academic Requirements</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subject:</span>
                <span className="font-semibold text-gray-900">{req.subject?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Class / Grade:</span>
                <span className="font-semibold text-gray-900">{req.class?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Board / Curriculum:</span>
                <span className="font-semibold text-gray-900">{req.board?.name || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Logistics Info */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Logistics & Compensation</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Locality:</span>
                <span className="font-semibold text-gray-900">{req.locality?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location Preference:</span>
                <span className="font-semibold text-gray-900">
                  {getTeachingLocationLabel(req.teaching_location_preference)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Offered Budget:</span>
                <span className="font-bold text-indigo-700">
                  ₹{req.budget_amount}{' '}
                  <span className="text-xs font-normal text-gray-500">
                    ({req.budget_type?.toLowerCase().replace('_', ' ')})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="mt-6 bg-gray-50 p-5 rounded-lg border border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Requested Weekly Timeslots</h3>
          {req.availability.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No specific schedule requested.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {req.availability.map((slot, i) => (
                <div key={i} className="bg-white p-3 rounded border border-gray-200 text-sm">
                  <span className="font-semibold text-gray-900 block">{DAYS[slot.day_of_week]}</span>
                  <span className="text-gray-600 text-xs">
                    {slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message / Notes */}
        {req.clean_message && (
          <div className="mt-6 bg-gray-50 p-5 rounded-lg border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Student / Parent Notes</h3>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{req.clean_message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
