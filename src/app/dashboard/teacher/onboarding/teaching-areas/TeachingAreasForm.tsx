/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { saveTeachingAreas } from '@/actions/teacher-onboarding'

interface Locality {
  id: string
  name: string
}

interface TeachingAreasFormProps {
  localities: Locality[]
  initialSelectedLocalities: string[]
}

export function TeachingAreasForm({
  localities,
  initialSelectedLocalities,
}: TeachingAreasFormProps) {
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>(initialSelectedLocalities)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleLocality = (id: string) => {
    setSelectedLocalities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
    if (error) setError(null)
  }

  const selectAll = () => {
    setSelectedLocalities(localities.map((l) => l.id))
    if (error) setError(null)
  }

  const clearAll = () => {
    setSelectedLocalities([])
  }

  const filteredLocalities = localities.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (selectedLocalities.length === 0) {
      e.preventDefault()
      setError('Please select at least one teaching locality in Balasore.')
      return
    }
    setIsSubmitting(true)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Step 4: Teaching Areas</h2>
      <p className="text-sm text-gray-500 mb-6">
        Select the localities in Balasore where you are available for offline home tutoring or batches.
      </p>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <form action={saveTeachingAreas as any} onSubmit={handleSubmit} className="space-y-6">
        {/* Hidden inputs to send selected IDs */}
        {selectedLocalities.map((id) => (
          <input key={id} type="hidden" name="localities" value={id} />
        ))}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label htmlFor="search-localities" className="block text-sm font-semibold text-gray-800">
                Localities in Balasore <span className="text-red-500">*</span>
              </label>
              {selectedLocalities.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedLocalities.length} selected
                </span>
              )}
            </div>
            <div className="flex space-x-2 text-xs">
              <button
                type="button"
                onClick={selectAll}
                className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              id="search-localities"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search localities (e.g., Sahadevkhunta, Motiganj, FM Nagar)..."
              className="w-full px-3.5 py-2.5 pl-9 text-sm rounded-lg border border-gray-300 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto p-1">
            {filteredLocalities.length > 0 ? (
              filteredLocalities.map((loc) => {
                const isSelected = selectedLocalities.includes(loc.id)
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => toggleLocality(loc.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="truncate mr-2">{loc.name}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="col-span-full py-6 text-center text-sm text-gray-500">
                No localities matching &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-gray-200">
          <Link
            href="/dashboard/teacher/onboarding/subjects-classes"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}
