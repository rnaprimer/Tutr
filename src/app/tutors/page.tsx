import { getFilteredTutors, TutorFilters } from '@/lib/data/tutors'
import { getTaxonomies } from '@/lib/data/teacher-taxonomies'
import TutorCard from '@/components/TutorCard'
import FilterSidebar from './FilterSidebar'

export const metadata = {
  title: 'Find Tutors in Balasore | Tutr',
  description: 'Discover and connect with verified local tutors in Balasore, Odisha.'
}

export default async function TutorsDiscoveryPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  
  const filters: TutorFilters = {
    subject_id: typeof params.subject_id === 'string' ? params.subject_id : undefined,
    class_id: typeof params.class_id === 'string' ? params.class_id : undefined,
    board_id: typeof params.board_id === 'string' ? params.board_id : undefined,
    locality_id: typeof params.locality_id === 'string' ? params.locality_id : undefined,
    pricing_type: typeof params.pricing_type === 'string' ? params.pricing_type : undefined,
  }

  // Fetch verified tutors based on filters
  const tutors = await getFilteredTutors(filters)
  
  // Fetch taxonomies for the sidebar (Balasore only)
  const taxonomies = await getTaxonomies()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Find Tutors in Balasore
          </h1>
          <p className="mt-2 text-gray-600">
            Browse verified, high-quality local tutors in your area.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <FilterSidebar taxonomies={taxonomies} />
          </div>

          {/* Results Grid */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{tutors.length}</span> tutors
              </p>
            </div>

            {tutors.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {tutors.map(tutor => (
                  <TutorCard key={tutor.teacher_id} tutor={tutor} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl border border-gray-100 text-center shadow-sm">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-4 text-sm font-medium text-gray-900">No tutors found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  We couldn&apos;t find any tutors matching your current filters in Balasore.
                </p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  )
}
