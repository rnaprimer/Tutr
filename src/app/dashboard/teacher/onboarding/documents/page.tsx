/* eslint-disable @typescript-eslint/no-explicit-any */

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData } from '@/lib/data/teacher-profile'
import { uploadVerificationDocument, deleteVerificationDocument, completeDocuments } from '@/actions/teacher-onboarding'
import Link from 'next/link'

export default async function DocumentsPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Step 7: Verification Documents</h2>
      <p className="text-sm text-gray-500 mb-6">Upload documents to verify your identity and qualifications. These remain private.</p>
      
      <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Upload new document</h3>
        <form action={uploadVerificationDocument as any} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="category" className="block text-xs text-gray-500 mb-1">Category</label>
            <select name="category" id="category" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white">
              <option value="IDENTITY">Identity Proof</option>
              <option value="QUALIFICATION">Qualification / Degree</option>
              <option value="EXPERIENCE">Experience Certificate</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="file" className="block text-xs text-gray-500 mb-1">File (PDF/Image, max 5MB)</label>
            <input type="file" name="file" id="file" required accept="image/*,.pdf" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1.5 border bg-white" />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none h-[38px]">
            Upload
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Documents</h3>
        {data.documents.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {data.documents.map((doc: any) => (
              <li key={doc.id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-900 mr-2">{doc.category}</span>
                  <span className="text-xs text-gray-500">
                    {doc.file_path.split('/').pop()}
                  </span>
                  {doc.status === 'REJECTED' && (
                    <p className="text-xs text-red-500 mt-1">Rejected: {doc.rejection_reason}</p>
                  )}
                </div>
                <form action={deleteVerificationDocument as any}>
                  <input type="hidden" name="id" value={doc.id} />
                  <input type="hidden" name="file_path" value={doc.file_path} />
                  <button type="submit" className="text-red-500 hover:text-red-700 text-sm font-medium ml-4">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={completeDocuments as any} className="flex justify-between pt-4 border-t border-gray-200">
        <Link href="/dashboard/teacher/onboarding/availability" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
          Back
        </Link>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Continue
        </button>
      </form>
    </div>
  )
}
