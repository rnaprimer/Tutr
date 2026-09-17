'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface Taxonomies {
  subjects: { id: number; name: string }[]
  classes: { id: number; name: string }[]
  boards: { id: number; name: string }[]
  localities: { id: number; name: string }[]
}

export default function FilterSidebar({ taxonomies }: { taxonomies: Taxonomies }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const handleFilterChange = (name: string, value: string) => {
    router.push('/tutors?' + createQueryString(name, value))
  }

  const handleClear = () => {
    router.push('/tutors')
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        {(searchParams.toString().length > 0) && (
          <button 
            onClick={handleClear}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Subject */}
        <div>
          <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <select
            id="subject_id"
            value={searchParams.get('subject_id') || ''}
            onChange={(e) => handleFilterChange('subject_id', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="">All Subjects</option>
            {taxonomies.subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Class */}
        <div>
          <label htmlFor="class_id" className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <select
            id="class_id"
            value={searchParams.get('class_id') || ''}
            onChange={(e) => handleFilterChange('class_id', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="">All Classes</option>
            {taxonomies.classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Board */}
        <div>
          <label htmlFor="board_id" className="block text-sm font-medium text-gray-700 mb-1">
            Board
          </label>
          <select
            id="board_id"
            value={searchParams.get('board_id') || ''}
            onChange={(e) => handleFilterChange('board_id', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="">All Boards</option>
            {taxonomies.boards.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Locality */}
        <div>
          <label htmlFor="locality_id" className="block text-sm font-medium text-gray-700 mb-1">
            Locality (Balasore)
          </label>
          <select
            id="locality_id"
            value={searchParams.get('locality_id') || ''}
            onChange={(e) => handleFilterChange('locality_id', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="">All Localities</option>
            {taxonomies.localities.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Pricing Type */}
        <div>
          <label htmlFor="pricing_type" className="block text-sm font-medium text-gray-700 mb-1">
            Pricing Type
          </label>
          <select
            id="pricing_type"
            value={searchParams.get('pricing_type') || ''}
            onChange={(e) => handleFilterChange('pricing_type', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="">Any</option>
            <option value="HOURLY">Hourly</option>
            <option value="PER_CLASS">Per Class</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
      </div>
    </div>
  )
}
