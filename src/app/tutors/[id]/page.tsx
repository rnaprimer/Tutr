import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTutorDetails } from '@/lib/data/tutors'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tutor = await getTutorDetails(id)
  
  if (!tutor) {
    return { title: 'Tutor Not Found | Tutr' }
  }

  return {
    title: `${tutor.display_name} | Tutr Balasore`,
    description: tutor.bio || `Learn with ${tutor.display_name} in Balasore.`
  }
}

export default async function TutorProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Safe fetch using public view
  const tutor = await getTutorDetails(id)

  if (!tutor) {
    // Return 404 cleanly so we don't leak whether an unverified tutor exists
    notFound()
  }

  // Get current user and role
  const currentUser = await getCurrentUser()
  const userRole = currentUser?.profile?.role

  const showRequestButton = !currentUser || userRole === 'STUDENT' || userRole === 'PARENT'
  const requestUrl = !currentUser
    ? `/login?callbackUrl=/tutors/${tutor.teacher_id}/request`
    : `/tutors/${tutor.teacher_id}/request`

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/tutors" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
            &larr; Back to all tutors
          </Link>
        </div>

        <div className="bg-white shadow rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-8 sm:p-10 border-b border-gray-100 flex flex-col sm:flex-row gap-8 items-start">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
              {tutor.avatar_url ? (
                <img src={tutor.avatar_url} alt={tutor.display_name || 'Tutor'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-semibold text-indigo-600">
                  {tutor.display_name?.charAt(0) || 'T'}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                    {tutor.display_name}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  </h1>
                </div>
                
                <div className="flex gap-3">
                  {showRequestButton && (
                    <Link 
                      href={requestUrl}
                      className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Request Tutor
                    </Link>
                  )}
                  <button className="inline-flex items-center justify-center p-2.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                  </button>
                </div>
              </div>

              <div className="mt-6 prose prose-indigo text-gray-600">
                <p className="whitespace-pre-wrap">{tutor.bio || 'No biography provided.'}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Subjects & Classes */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Teaching Subjects</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {tutor.subjects.map(s => (
                  <span key={s.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {s.name}
                  </span>
                ))}
              </div>

              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Classes</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {tutor.classes.map(c => (
                  <span key={c.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {c.name}
                  </span>
                ))}
              </div>

              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Boards</h3>
              <div className="flex flex-wrap gap-2">
                {tutor.boards.map(b => (
                  <span key={b.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {b.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Logistics */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Pricing</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-lg font-bold text-gray-900">
                    {tutor.pricing_type === 'HOURLY' && tutor.hourly_fee ? `₹${tutor.hourly_fee} / hour` :
                     tutor.pricing_type === 'PER_CLASS' && tutor.per_class_fee ? `₹${tutor.per_class_fee} / class` :
                     tutor.pricing_type === 'MONTHLY' && tutor.monthly_fee ? `₹${tutor.monthly_fee} / month` :
                     'Contact for pricing'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Teaching Preference</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">
                    {tutor.teaching_location === 'STUDENT_HOME' ? 'At Student\'s Home' :
                     tutor.teaching_location === 'TEACHER_LOCATION' ? 'At Tutor\'s Location' :
                     tutor.teaching_location === 'BOTH' ? 'At Student\'s or Tutor\'s Location' :
                     'Not Specified'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Areas Served (Balasore)</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {tutor.localities.map(l => (
                      <li key={l.id}>{l.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
