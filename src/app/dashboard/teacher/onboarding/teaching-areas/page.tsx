/* eslint-disable @typescript-eslint/no-explicit-any */

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData } from '@/lib/data/teacher-profile'
import { getTaxonomies } from '@/lib/data/teacher-taxonomies'
import { saveTeachingAreas } from '@/actions/teacher-onboarding'
import Link from 'next/link'

export default async function TeachingAreasPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)
  const taxonomies = await getTaxonomies()

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Step 4: Teaching Areas</h2>
      <p className="text-sm text-gray-500 mb-6">Select the localities in Balasore where you are willing to teach.</p>
      
      <form action={saveTeachingAreas as any} className="space-y-6">
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {taxonomies.localities.length > 0 ? (
              taxonomies.localities.map((l: any) => (
                <label key={l.id} className="flex items-center space-x-2 bg-gray-50 p-2 rounded border border-gray-200">
                  <input 
                    type="checkbox" 
                    name="localities" 
                    value={l.id} 
                    defaultChecked={data.localities.includes(l.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{l.name}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No localities found. Please contact support.</p>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Link href="/dashboard/teacher/onboarding/subjects-classes" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Back
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  )
}
