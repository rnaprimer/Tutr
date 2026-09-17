/* eslint-disable @typescript-eslint/no-explicit-any */

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData } from '@/lib/data/teacher-profile'
import { addAvailability, deleteAvailability, completeAvailability } from '@/actions/teacher-onboarding'
import Link from 'next/link'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function AvailabilityPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 6: Availability</h2>
      
      <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add a new slot</h3>
        <form action={addAvailability as any} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="day_of_week" className="block text-xs text-gray-500 mb-1">Day</label>
            <select name="day_of_week" id="day_of_week" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white">
              {DAYS.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="start_time" className="block text-xs text-gray-500 mb-1">Start Time</label>
            <input type="time" name="start_time" id="start_time" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
          <div className="flex-1">
            <label htmlFor="end_time" className="block text-xs text-gray-500 mb-1">End Time</label>
            <input type="time" name="end_time" id="end_time" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none h-[38px]">
            Add Slot
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Your Current Slots</h3>
        {data.availability.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No availability added yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {data.availability.sort((a: any, b: any) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)).map((slot: any) => (
              <li key={slot.id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-900 w-24 inline-block">{DAYS[slot.day_of_week]}</span>
                  <span className="text-gray-600 ml-4">{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</span>
                </div>
                <form action={deleteAvailability as any}>
                  <input type="hidden" name="id" value={slot.id} />
                  <button type="submit" className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={completeAvailability as any} className="flex justify-between pt-4 border-t border-gray-200">
        <Link href="/dashboard/teacher/onboarding/pricing" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
          Back
        </Link>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Continue
        </button>
      </form>
    </div>
  )
}
