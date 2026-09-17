'use client'

import { useActionState } from 'react'
import { addStudent } from '@/actions/students'

export default function AddStudentForm() {
  const [state, formAction, isPending] = useActionState(addStudent, null)

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add a Student</h3>
      
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            {state.success}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Student Name</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              name="name"
              id="name"
              required
              className="block w-full rounded-none rounded-l-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
              placeholder="e.g. Rahul"
            />
            <button
              type="submit"
              disabled={isPending}
              className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              {isPending ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
