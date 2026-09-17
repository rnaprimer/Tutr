'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EnrichedTutorProfile } from '@/lib/data/tutors'
import {
  createStudentTutorRequest,
  createParentTutorRequest,
  AvailabilitySlotInput,
} from '@/actions/tutor-requests'
import {
  getTeachingLocationLabel,
  TeachingLocationPreference,
} from '@/lib/utils/teaching-location'
import { Database } from '@/types/database'

type PricingType = Database['public']['Enums']['pricing_type']

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

interface LinkedStudent {
  id: string
  name: string
}

interface TutorRequestWizardProps {
  tutor: EnrichedTutorProfile
  userRole: 'STUDENT' | 'PARENT'
  currentUserName: string
  linkedStudents?: LinkedStudent[]
}

export function TutorRequestWizard({
  tutor,
  userRole,
  currentUserName,
  linkedStudents = [],
}: TutorRequestWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null)

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    userRole === 'PARENT' && linkedStudents.length > 0 ? linkedStudents[0].id : ''
  )
  const [subjectId, setSubjectId] = useState<number>(
    tutor.subjects.length > 0 ? tutor.subjects[0].id : 0
  )
  const [classId, setClassId] = useState<number>(
    tutor.classes.length > 0 ? tutor.classes[0].id : 0
  )
  const [boardId, setBoardId] = useState<number>(
    tutor.boards.length > 0 ? tutor.boards[0].id : 0
  )
  const [localityId, setLocalityId] = useState<number>(
    tutor.localities.length > 0 ? tutor.localities[0].id : 0
  )
  const [teachingLocation, setTeachingLocation] = useState<TeachingLocationPreference>(
    tutor.teaching_location || 'STUDENT_HOME'
  )
  const [budgetType, setBudgetType] = useState<PricingType>(
    tutor.pricing_type || 'MONTHLY'
  )
  const defaultBudget =
    budgetType === 'HOURLY'
      ? tutor.hourly_fee || 300
      : budgetType === 'PER_CLASS'
      ? tutor.per_class_fee || 250
      : tutor.monthly_fee || 2000

  const [budgetAmount, setBudgetAmount] = useState<number>(defaultBudget)
  const [message, setMessage] = useState<string>('')

  // Availability Slots State
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlotInput[]>([
    { day_of_week: 1, start_time: '17:00', end_time: '18:30' },
  ])

  const totalSteps = 6

  const addSlot = () => {
    setAvailabilitySlots(prev => [
      ...prev,
      { day_of_week: 3, start_time: '17:00', end_time: '18:30' },
    ])
  }

  const removeSlot = (index: number) => {
    if (availabilitySlots.length <= 1) return
    setAvailabilitySlots(prev => prev.filter((_, i) => i !== index))
  }

  const updateSlot = (index: number, field: keyof AvailabilitySlotInput, val: unknown) => {
    setAvailabilitySlots(prev =>
      prev.map((slot, i) => {
        if (i !== index) return slot
        return { ...slot, [field]: val }
      })
    )
  }

  // Step Validations
  const validateStep = (step: number): boolean => {
    setErrorMessage(null)
    if (step === 1) {
      if (userRole === 'PARENT' && !selectedStudentId) {
        setErrorMessage('Please select a student for this request.')
        return false
      }
      return true
    }
    if (step === 2) {
      if (!subjectId || !classId || !boardId) {
        setErrorMessage('Please select subject, class, and board.')
        return false
      }
      return true
    }
    if (step === 3) {
      if (!localityId) {
        setErrorMessage('Please select a locality.')
        return false
      }
      if (budgetAmount <= 0 || isNaN(budgetAmount)) {
        setErrorMessage('Please enter a valid positive budget amount.')
        return false
      }
      return true
    }
    if (step === 4) {
      if (availabilitySlots.length === 0) {
        setErrorMessage('Please add at least one availability slot.')
        return false
      }
      for (const slot of availabilitySlots) {
        if (!slot.start_time || !slot.end_time) {
          setErrorMessage('All slots must have start and end times.')
          return false
        }
        if (slot.start_time >= slot.end_time) {
          setErrorMessage(`Start time (${slot.start_time}) must be earlier than end time (${slot.end_time}).`)
          return false
        }
      }
      return true
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setErrorMessage(null)
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setCurrentStep(4)
      return
    }

    if (!tutor.teacher_id) {
      setErrorMessage('Invalid tutor profile.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    const payload = {
      teacher_id: tutor.teacher_id,
      student_id: userRole === 'PARENT' ? selectedStudentId : undefined,
      subject_id: subjectId,
      class_id: classId,
      board_id: boardId,
      locality_id: localityId,
      budget_amount: Number(budgetAmount),
      budget_type: budgetType,
      teaching_location: teachingLocation,
      message: message.trim() || undefined,
      availability: availabilitySlots,
    }

    const res =
      userRole === 'PARENT'
        ? await createParentTutorRequest(payload)
        : await createStudentTutorRequest(payload)

    setSubmitting(false)

    if (res.error) {
      setErrorMessage(res.error)
      return
    }

    if (res.success && res.requestId) {
      setSubmittedRequestId(res.requestId)
    }
  }

  // Success State Screen
  if (submittedRequestId) {
    const dashboardLink =
      userRole === 'PARENT'
        ? `/dashboard/parent/requests`
        : `/dashboard/student/requests`

    return (
      <div className="bg-white rounded-xl shadow p-8 text-center max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your tutor request has been submitted!
        </h2>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Waiting for tutor response
        </div>
        <p className="text-gray-600 mb-6 text-sm">
          We have notified <span className="font-semibold text-gray-900">{tutor.display_name}</span>.
          Submission does not mean the tutor has accepted yet. You will be able to monitor their response in your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={dashboardLink}
            className="inline-flex justify-center items-center px-6 py-2.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            View My Requests
          </Link>
          <Link
            href="/tutors"
            className="inline-flex justify-center items-center px-6 py-2.5 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            Browse More Tutors
          </Link>
        </div>
      </div>
    )
  }

  const selectedSubject = tutor.subjects.find(s => s.id === subjectId)?.name || 'N/A'
  const selectedClass = tutor.classes.find(c => c.id === classId)?.name || 'N/A'
  const selectedBoard = tutor.boards.find(b => b.id === boardId)?.name || 'N/A'
  const selectedLocality = tutor.localities.find(l => l.id === localityId)?.name || 'N/A'
  const studentDisplayName =
    userRole === 'PARENT'
      ? linkedStudents.find(s => s.id === selectedStudentId)?.name || 'Selected Student'
      : currentUserName

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
      {/* Step Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Step {currentStep} of {totalSteps}
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
              {currentStep === 1 && 'Student Information'}
              {currentStep === 2 && 'Academic Requirements'}
              {currentStep === 3 && 'Location & Budget'}
              {currentStep === 4 && 'Preferred Availability'}
              {currentStep === 5 && 'Additional Notes'}
              {currentStep === 6 && 'Review & Submit'}
            </h2>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-1.5 rounded-full transition-colors ${
                  i + 1 <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-6 sm:p-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Student */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {userRole === 'STUDENT' ? (
              <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Requester</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{currentUserName}</p>
                <p className="text-sm text-gray-600 mt-1">
                  You are logged in as a student. This request will be directly associated with your account.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Select Student
                </label>
                {linkedStudents.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                    <p className="font-medium">No students linked to your parent account.</p>
                    <p className="mt-1">
                      You must add a student before you can request a tutor.
                    </p>
                    <Link
                      href="/dashboard/parent"
                      className="mt-3 inline-block font-semibold text-indigo-600 hover:text-indigo-700 underline"
                    >
                      &rarr; Go to Parent Dashboard to add a student
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedStudents.map(student => (
                      <label
                        key={student.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedStudentId === student.id
                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedStudent"
                          value={student.id}
                          checked={selectedStudentId === student.id}
                          onChange={() => setSelectedStudentId(student.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-900">{student.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Academic Requirements */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                id="subject-select"
                value={subjectId}
                onChange={e => setSubjectId(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {tutor.subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-1">
                Class / Grade
              </label>
              <select
                id="class-select"
                value={classId}
                onChange={e => setClassId(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {tutor.classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="board-select" className="block text-sm font-medium text-gray-700 mb-1">
                Board / Curriculum
              </label>
              <select
                id="board-select"
                value={boardId}
                onChange={e => setBoardId(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {tutor.boards.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: Location & Budget */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="locality-select" className="block text-sm font-medium text-gray-700 mb-1">
                Locality (Balasore)
              </label>
              <select
                id="locality-select"
                value={localityId}
                onChange={e => setLocalityId(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {tutor.localities.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Teaching Location
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'STUDENT_HOME', label: "Student's Home" },
                  { value: 'TEACHER_LOCATION', label: "Tutor's Location" },
                  { value: 'BOTH', label: 'Flexible / Either' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                      teachingLocation === opt.value
                        ? 'border-indigo-600 bg-indigo-50/50 font-medium text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="teachingLocation"
                      value={opt.value}
                      checked={teachingLocation === opt.value}
                      onChange={() => setTeachingLocation(opt.value as TeachingLocationPreference)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="budget-type-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Structure
                </label>
                <select
                  id="budget-type-select"
                  value={budgetType}
                  onChange={e => setBudgetType(e.target.value as PricingType)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="HOURLY">Hourly (₹/hour)</option>
                  <option value="PER_CLASS">Per Class (₹/class)</option>
                  <option value="MONTHLY">Monthly (₹/month)</option>
                </select>
              </div>

              <div>
                <label htmlFor="budget-amount-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Amount (₹ INR)
                </label>
                <input
                  id="budget-amount-input"
                  type="number"
                  min="0"
                  step="50"
                  value={budgetAmount}
                  onChange={e => setBudgetAmount(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Preferred Availability */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Specify the days and time slots when you would prefer tutoring sessions to take place:
            </p>

            <div className="space-y-3">
              {availabilitySlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Day</label>
                    <select
                      value={slot.day_of_week}
                      onChange={e => updateSlot(idx, 'day_of_week', Number(e.target.value))}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {DAYS.map(d => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={slot.start_time}
                      onChange={e => updateSlot(idx, 'start_time', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                    <input
                      type="time"
                      value={slot.end_time}
                      onChange={e => updateSlot(idx, 'end_time', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {availabilitySlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      className="mt-4 sm:mt-5 text-red-500 hover:text-red-700 text-sm font-medium p-1"
                      title="Remove Slot"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSlot}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 pt-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Another Slot
            </button>
          </div>
        )}

        {/* STEP 5: Additional Requirements */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <label htmlFor="notes-textarea" className="block text-sm font-medium text-gray-700">
              Message / Specific Requirements (Optional)
            </label>
            <textarea
              id="notes-textarea"
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="E.g., Looking for preparation for upcoming half-yearly exams, special focus on trigonometry, etc."
              className="w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500">
              Do not include private contact information or exact residential addresses here. You can finalize logistics once the tutor accepts.
            </p>
          </div>
        )}

        {/* STEP 6: Review & Final Submission */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 divide-y divide-gray-200">
              <div className="pb-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Tutor</span>
                <span className="text-sm font-bold text-gray-900">{tutor.display_name}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Student</span>
                <span className="text-sm font-semibold text-gray-900">{studentDisplayName}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Subject</span>
                <span className="text-sm font-semibold text-gray-900">{selectedSubject}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Class & Board</span>
                <span className="text-sm font-semibold text-gray-900">
                  {selectedClass} ({selectedBoard})
                </span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Locality</span>
                <span className="text-sm font-semibold text-gray-900">{selectedLocality}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Preferred Location</span>
                <span className="text-sm font-semibold text-gray-900">
                  {getTeachingLocationLabel(teachingLocation)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Offered Budget</span>
                <span className="text-sm font-bold text-indigo-700">
                  ₹{budgetAmount} ({budgetType.toLowerCase().replace('_', ' ')})
                </span>
              </div>
              <div className="pt-3">
                <span className="text-sm font-medium text-gray-500 block mb-2">Preferred Schedule:</span>
                <ul className="space-y-1 text-sm text-gray-700">
                  {availabilitySlots.map((slot, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-24 font-medium">
                        {DAYS.find(d => d.value === slot.day_of_week)?.label}:
                      </span>
                      <span>
                        {slot.start_time} — {slot.end_time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {message && (
                <div className="pt-3">
                  <span className="text-sm font-medium text-gray-500 block mb-1">Notes:</span>
                  <p className="text-sm text-gray-800 italic">&ldquo;{message}&rdquo;</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
              Please note: Submitting this request sends an invitation to the tutor. They will review your requirements and choose to accept or decline.
            </div>
          </div>
        )}

        {/* Wizard Navigation Buttons */}
        <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between items-center">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              &larr; Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={userRole === 'PARENT' && linkedStudents.length === 0}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Continue &rarr;
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
