import Link from 'next/link'
import { getParentRequests } from '@/lib/data/tutor-requests'
import { RequestStatusBadge } from '@/components/requests/RequestStatusBadge'
import { getTeachingLocationLabel } from '@/lib/utils/teaching-location'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function ParentRequestsPage() {
  const requests = await getParentRequests()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/parent" className="text-sm text-indigo-600 hover:text-indigo-500">
              &larr; Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tutor Requests for Your Students</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage tuition requests submitted for your children to verified tutors in Balasore.
          </p>
        </div>
        <Link
          href="/tutors"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Find a Tutor
        </Link>
      </div>

      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tutor requests yet.</h3>
          <p className="text-sm text-gray-500 mb-6">
            Find the right verified home tutor in Balasore for your child and submit a tuition request.
          </p>
          <Link
            href="/tutors"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            Browse Verified Tutors
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div
              key={req.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-indigo-300 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                    {req.tutor?.avatar_url ? (
                      <img src={req.tutor.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      req.tutor?.display_name?.charAt(0) || 'T'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Student: {req.student_name || 'Your Student'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mt-1">
                      Tutor: {req.tutor?.display_name || 'Verified Tutor'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Requested on {new Date(req.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  <RequestStatusBadge status={req.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block">Subject & Class</span>
                  <span className="font-semibold text-gray-900">
                    {req.subject?.name || 'N/A'} • {req.class?.name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Locality</span>
                  <span className="font-medium text-gray-800">{req.locality?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Offered Budget</span>
                  <span className="font-semibold text-indigo-700">
                    ₹{req.budget_amount}{' '}
                    <span className="text-xs font-normal text-gray-500">
                      ({req.budget_type?.toLowerCase().replace('_', ' ') || ''})
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Location Preference</span>
                  <span className="font-medium text-gray-800">
                    {getTeachingLocationLabel(req.teaching_location_preference)}
                  </span>
                </div>
              </div>

              {req.availability.length > 0 && (
                <div className="pt-2 text-xs text-gray-600 flex flex-wrap gap-2 items-center">
                  <span className="font-semibold text-gray-700">Schedule:</span>
                  {req.availability.map((s, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {DAYS[s.day_of_week]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <Link
                  href={`/dashboard/parent/requests/${req.id}`}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                >
                  View Request Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
