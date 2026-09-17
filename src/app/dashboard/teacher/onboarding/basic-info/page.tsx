/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData } from '@/lib/data/teacher-profile'
import { saveBasicInformation } from '@/actions/teacher-onboarding'
import Link from 'next/link'

export default async function BasicInfoPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 1: Basic Information</h2>
      
      <form action={saveBasicInformation as any} className="space-y-6">
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input 
            type="text" 
            id="display_name" 
            name="display_name" 
            defaultValue={data.basicInfo.display_name} 
            required 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>

        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input 
            type="tel" 
            id="phone_number" 
            name="phone_number" 
            defaultValue={data.basicInfo.phone_number || ''} 
            required 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Link href="/dashboard/teacher" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Back to Dashboard
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  )
}
