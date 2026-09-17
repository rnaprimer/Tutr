import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getTutorDetails } from '@/lib/data/tutors'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getMyStudents } from '@/actions/students'
import { TutorRequestWizard } from '@/components/requests/TutorRequestWizard'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tutor = await getTutorDetails(id)

  if (!tutor) {
    return { title: 'Tutor Not Found | Tutr' }
  }

  return {
    title: `Request Tuition with ${tutor.display_name} | Tutr Balasore`,
    description: `Submit a personalized tutor request to ${tutor.display_name}.`,
  }
}

export default async function RequestTutorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tutor = await getTutorDetails(id)

  if (!tutor) {
    notFound()
  }

  const user = await getCurrentUser()

  if (!user) {
    // Safe callback redirect to internal path
    redirect(`/login?callbackUrl=/tutors/${id}/request`)
  }

  const role = user.profile?.role

  if (role !== 'STUDENT' && role !== 'PARENT') {
    redirect('/unauthorized')
  }

  let linkedStudents: { id: string; name: string }[] = []
  if (role === 'PARENT') {
    linkedStudents = await getMyStudents()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={`/tutors/${id}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1"
          >
            &larr; Back to {tutor.display_name}&apos;s Profile
          </Link>
        </div>

        {/* Tutor Preview Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            {tutor.avatar_url ? (
              <img
                src={tutor.avatar_url}
                alt={tutor.display_name || 'Tutor'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-indigo-600">
                {tutor.display_name?.charAt(0) || 'T'}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{tutor.display_name}</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Verified
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Offline Tuition in Balasore, Odisha
            </p>
          </div>
        </div>

        {/* Multi-Step Wizard */}
        <TutorRequestWizard
          tutor={tutor}
          userRole={role}
          currentUserName={user.profile?.display_name || 'User'}
          linkedStudents={linkedStudents}
        />
      </div>
    </div>
  )
}
