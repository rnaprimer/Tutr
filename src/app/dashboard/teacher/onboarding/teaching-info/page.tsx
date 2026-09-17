/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData } from '@/lib/data/teacher-profile'
import { saveTeachingInformation } from '@/actions/teacher-onboarding'
import Link from 'next/link'

export default async function TeachingInfoPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 2: Teaching Information</h2>
      
      <form action={saveTeachingInformation as any} className="space-y-6">
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Biography / About You</label>
          <textarea 
            id="bio" 
            name="bio" 
            rows={5}
            defaultValue={data.teacherProfile.bio || ''} 
            required 
            placeholder="Tell students and parents about your teaching experience and style..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>

        <div>
          <label htmlFor="teaching_location" className="block text-sm font-medium text-gray-700">Teaching Location</label>
          <select 
            id="teaching_location" 
            name="teaching_location" 
            defaultValue={data.teacherProfile.teaching_location || ''} 
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
          >
            <option value="" disabled>Select a location type</option>
            <option value="STUDENT_HOME">Student&apos;s Home</option>
            <option value="TEACHER_LOCATION">Teacher&apos;s Location</option>
            <option value="BOTH">Both</option>
          </select>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Link href="/dashboard/teacher/onboarding/basic-info" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
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
