import Link from 'next/link'
import { getTeacherRequests } from '@/lib/data/tutor-requests'
import { RequestStatusBadge } from '@/components/requests/RequestStatusBadge'
import { getTeachingLocationLabel } from '@/lib/utils/teaching-location'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function TeacherRequestsPage() {
  const requests = await getTeacherRequests()

  const pendingCount = requests.filter(r => r.status === 'PENDING').length
  const activeCount = requests.filter(r => r.status === 'ACCEPTED').length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/teacher" className="text-sm text-indigo-600 hover:text-indigo-500">
              &larr; Teacher Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Incoming Tutor Requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and respond to tuition requests submitted by local students and parents in Balasore.
          </p>
        </div>

        {/* Quick Summary Pills */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-800 font-medium">
            <span className="font-bold text-sm text-amber-900 mr-1">{pendingCount}</span>
            Pending
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs text-green-800 font-medium">
            <span className="font-bold text-sm text-green-900 mr-1">{activeCount}</span>
            Active
          </div>
        </div>
      </div>

      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No incoming tutor requests.</h3>
          <p className="text-sm text-gray-500 mb-6">
            When students or parents in Balasore request you as their tutor, their requests will appear here for your review.
          </p>
          <Link
            href="/dashboard/teacher/profile"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            Manage Your Teaching Profile
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div
              key={req.id}
              className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${
                req.status === 'PENDING'
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">
                      Request ID: <span className="font-mono">{req.id.slice(0, 8)}...</span>
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      Received {new Date(req.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {req.subject?.name || 'Tuition Request'} ({req.class?.name || ''})
                  </h3>
                </div>
                <div>
                  <RequestStatusBadge status={req.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block">Board</span>
                  <span className="font-semibold text-gray-900">{req.board?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Locality</span>
                  <span className="font-semibold text-gray-900">{req.locality?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Budget Offered</span>
                  <span className="font-bold text-indigo-700">
                    ₹{req.budget_amount}{' '}
                    <span className="text-xs font-normal text-gray-500">
                      ({req.budget_type?.toLowerCase().replace('_', ' ') || ''})
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Teaching Location</span>
                  <span className="font-medium text-gray-800">
                    {getTeachingLocationLabel(req.teaching_location_preference)}
                  </span>
                </div>
              </div>

              {req.availability.length > 0 && (
                <div className="pt-2 text-xs text-gray-600 flex flex-wrap gap-2 items-center">
                  <span className="font-semibold text-gray-700">Requested Times:</span>
                  {req.availability.map((s, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {DAYS[s.day_of_week]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  {req.status === 'PENDING' && (
                    <span className="text-xs font-medium text-amber-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Action required: Review and accept or decline
                    </span>
                  )}
                </div>
                <Link
                  href={`/dashboard/teacher/requests/${req.id}`}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                >
                  View Details & Respond &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
