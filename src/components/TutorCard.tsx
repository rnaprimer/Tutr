import Link from 'next/link'
import { EnrichedTutorProfile } from '@/lib/data/tutors'

export default function TutorCard({ tutor }: { tutor: EnrichedTutorProfile }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {tutor.avatar_url ? (
            <img src={tutor.avatar_url} alt={tutor.display_name || 'Tutor'} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-indigo-600">
              {tutor.display_name?.charAt(0) || 'T'}
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-gray-900">
              {tutor.display_name || 'Anonymous Tutor'}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Verified
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {tutor.bio || 'No bio provided.'}
          </p>

          <div className="mt-3 flex flex-wrap gap-1">
            {tutor.subjects.slice(0, 3).map(sub => (
              <span key={sub.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                {sub.name}
              </span>
            ))}
            {tutor.subjects.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600">
                +{tutor.subjects.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs font-medium">Pricing</p>
          <p className="text-gray-900 font-medium mt-0.5">
            {tutor.pricing_type === 'HOURLY' && tutor.hourly_fee ? `₹${tutor.hourly_fee}/hr` :
             tutor.pricing_type === 'PER_CLASS' && tutor.per_class_fee ? `₹${tutor.per_class_fee}/class` :
             tutor.pricing_type === 'MONTHLY' && tutor.monthly_fee ? `₹${tutor.monthly_fee}/mo` :
             'Negotiable'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium">Location</p>
          <p className="text-gray-900 mt-0.5 truncate">
            {tutor.localities.slice(0, 2).map(l => l.name).join(', ')}
            {tutor.localities.length > 2 ? '...' : ''}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Link 
          href={`/tutors/${tutor.teacher_id}`}
          className="block w-full text-center py-2 px-4 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          View Profile
        </Link>
      </div>
    </div>
  )
}
