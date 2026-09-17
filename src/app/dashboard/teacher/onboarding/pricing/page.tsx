/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData } from '@/lib/data/teacher-profile'
import { savePricing } from '@/actions/teacher-onboarding'
import Link from 'next/link'

export default async function PricingPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)
  
  const pt = data.teacherProfile.pricing_type
  let currentFee = ''
  if (pt === 'HOURLY' && data.teacherProfile.hourly_fee) currentFee = data.teacherProfile.hourly_fee.toString()
  if (pt === 'PER_CLASS' && data.teacherProfile.per_class_fee) currentFee = data.teacherProfile.per_class_fee.toString()
  if (pt === 'MONTHLY' && data.teacherProfile.monthly_fee) currentFee = data.teacherProfile.monthly_fee.toString()

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 5: Pricing</h2>
      
      <form action={savePricing as any} className="space-y-6 max-w-md">
        <div>
          <label htmlFor="pricing_type" className="block text-sm font-medium text-gray-700">Fee Structure</label>
          <select 
            id="pricing_type" 
            name="pricing_type" 
            defaultValue={pt || ''} 
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
          >
            <option value="" disabled>Select a pricing model</option>
            <option value="HOURLY">Per Hour</option>
            <option value="PER_CLASS">Per Class/Session</option>
            <option value="MONTHLY">Per Month</option>
          </select>
        </div>

        <div>
          <label htmlFor="fee" className="block text-sm font-medium text-gray-700">Amount (INR) <span className="text-red-500">*</span></label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input 
              type="number" 
              name="fee" 
              id="fee"
              min="0"
              defaultValue={currentFee} 
              required
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border" 
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Link href="/dashboard/teacher/onboarding/teaching-areas" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
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
