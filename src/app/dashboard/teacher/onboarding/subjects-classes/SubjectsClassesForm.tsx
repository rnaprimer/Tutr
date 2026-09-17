/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TaxonomyItem {
  id: number
  name: string
}

interface SubjectsClassesFormProps {
  initialSubjects: number[]
  initialClasses: number[]
  initialBoards: number[]
  allSubjects: TaxonomyItem[]
  allClasses: TaxonomyItem[]
  allBoards: TaxonomyItem[]
  action: (formData: FormData) => Promise<any>
}

export function SubjectsClassesForm({
  initialSubjects,
  initialClasses,
  initialBoards,
  allSubjects,
  allClasses,
  allBoards,
  action,
}: SubjectsClassesFormProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>(initialSubjects)
  const [selectedClasses, setSelectedClasses] = useState<number[]>(initialClasses)
  const [selectedBoards, setSelectedBoards] = useState<number[]>(initialBoards)

  const [subjectQuery, setSubjectQuery] = useState('')
  const [classQuery, setClassQuery] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtered lists
  const filteredSubjects = allSubjects.filter((s) =>
    s.name.toLowerCase().includes(subjectQuery.toLowerCase())
  )

  const filteredClasses = allClasses.filter((c) =>
    c.name.toLowerCase().includes(classQuery.toLowerCase())
  )

  const toggleSubject = (id: number) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleClass = (id: number) => {
    setSelectedClasses((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleBoard = (id: number) => {
    setSelectedBoards((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (selectedSubjects.length === 0 || selectedClasses.length === 0) {
      e.preventDefault()
      setErrorMessage('Please select at least one subject and at least one class to continue.')
      return
    }
    setErrorMessage(null)
    setIsSubmitting(true)
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-10">
      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* 1. SUBJECTS SECTION */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Which subjects do you teach? <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500">
              Select all subjects you are qualified and ready to teach.
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 self-start sm:self-auto">
            {selectedSubjects.length} selected
          </span>
        </div>

        {/* Search / Filter Text Input */}
        <div className="mb-4">
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
              placeholder="Type to search subjects (e.g. Mathematics, Science, English)..."
              className="block w-full rounded-md border-0 py-2 pl-9 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
            {subjectQuery && (
              <button
                type="button"
                onClick={() => setSubjectQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1 border border-gray-100 rounded-lg bg-gray-50/50">
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((s) => {
              const isChecked = selectedSubjects.includes(s.id)
              return (
                <label
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="subjects"
                    value={s.id}
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent label
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${isChecked ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                    {s.name}
                  </span>
                </label>
              )
            })
          ) : (
            <div className="col-span-full p-4 text-center text-sm text-gray-500">
              No subjects found matching &ldquo;{subjectQuery}&rdquo;.
            </div>
          )}
        </div>
      </div>

      {/* 2. CLASSES SECTION */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Which classes do you teach? <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500">Select all student grade levels you accept.</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 self-start sm:self-auto">
            {selectedClasses.length} selected
          </span>
        </div>

        {/* Classes Search Input */}
        <div className="mb-4">
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              value={classQuery}
              onChange={(e) => setClassQuery(e.target.value)}
              placeholder="Filter classes (e.g. Class 10, Class 12)..."
              className="block w-full rounded-md border-0 py-2 pl-9 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
            {classQuery && (
              <button
                type="button"
                onClick={() => setClassQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {filteredClasses.map((c) => {
            const isChecked = selectedClasses.includes(c.id)
            return (
              <label
                key={c.id}
                onClick={() => toggleClass(c.id)}
                className={`flex items-center space-x-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  name="classes"
                  value={c.id}
                  checked={isChecked}
                  onChange={() => {}}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm ${isChecked ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                  {c.name}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* 3. BOARDS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Which educational boards? <span className="text-gray-400 text-sm font-normal">(Optional)</span>
            </h3>
            <p className="text-sm text-gray-500">Leave unselected if you teach across any board syllabus.</p>
          </div>
          {selectedBoards.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {selectedBoards.length} selected
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allBoards.map((b) => {
            const isChecked = selectedBoards.includes(b.id)
            return (
              <label
                key={b.id}
                onClick={() => toggleBoard(b.id)}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  name="boards"
                  value={b.id}
                  checked={isChecked}
                  onChange={() => {}}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm ${isChecked ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                  {b.name}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Link
          href="/dashboard/teacher/onboarding/teaching-info"
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Back
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </form>
  )
}
