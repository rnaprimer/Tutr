/* eslint-disable @typescript-eslint/no-explicit-any */

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData } from '@/lib/data/teacher-profile'
import { getTaxonomies } from '@/lib/data/teacher-taxonomies'
import { saveTaxonomies } from '@/actions/teacher-onboarding'
import Link from 'next/link'

export default async function SubjectsClassesPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)
  const taxonomies = await getTaxonomies()

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 3: Subjects & Classes</h2>
      
      <form action={saveTaxonomies as any} className="space-y-8">
        
        {/* SUBJECTS */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Which subjects do you teach? <span className="text-red-500">*</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {taxonomies.subjects.map((s: any) => (
              <label key={s.id} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  name="subjects" 
                  value={s.id} 
                  defaultChecked={data.subjects.includes(s.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* CLASSES */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Which classes do you teach? <span className="text-red-500">*</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {taxonomies.classes.map((c: any) => (
              <label key={c.id} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  name="classes" 
                  value={c.id} 
                  defaultChecked={data.classes.includes(c.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* BOARDS */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Which educational boards? <span className="text-gray-400 text-sm font-normal">(Optional)</span></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {taxonomies.boards.map((b: any) => (
              <label key={b.id} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  name="boards" 
                  value={b.id} 
                  defaultChecked={data.boards.includes(b.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{b.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Link href="/dashboard/teacher/onboarding/teaching-info" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
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
