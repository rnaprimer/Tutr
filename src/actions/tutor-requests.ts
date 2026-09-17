'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'
import {
  encodeRequestMessage,
  isValidTeachingLocation,
  TeachingLocationPreference,
} from '@/lib/utils/teaching-location'
import { Database } from '@/types/database'

type PricingType = Database['public']['Enums']['pricing_type']

export interface AvailabilitySlotInput {
  day_of_week: number
  start_time: string
  end_time: string
}

export interface CreateRequestInput {
  teacher_id: string
  student_id?: string // Required for PARENT, ignored/overridden for STUDENT
  subject_id: number
  class_id: number
  board_id: number
  locality_id: number
  budget_amount: number
  budget_type: PricingType
  teaching_location?: TeachingLocationPreference | null
  message?: string
  availability: AvailabilitySlotInput[]
}

export interface ActionResponse {
  success?: boolean
  error?: string
  requestId?: string
}

const VALID_PRICING_TYPES: PricingType[] = ['HOURLY', 'PER_CLASS', 'MONTHLY']

/**
 * Validates request fields and availability slots.
 */
function validateRequestInput(input: CreateRequestInput): string | null {
  if (!input.teacher_id) {
    return 'Teacher ID is required.'
  }
  if (!input.subject_id || typeof input.subject_id !== 'number') {
    return 'Please select a valid subject.'
  }
  if (!input.class_id || typeof input.class_id !== 'number') {
    return 'Please select a valid class.'
  }
  if (!input.board_id || typeof input.board_id !== 'number') {
    return 'Please select a valid board.'
  }
  if (!input.locality_id || typeof input.locality_id !== 'number') {
    return 'Please select a valid locality.'
  }
  if (typeof input.budget_amount !== 'number' || input.budget_amount < 0 || isNaN(input.budget_amount)) {
    return 'Budget amount must be a non-negative number.'
  }
  if (!input.budget_type || !VALID_PRICING_TYPES.includes(input.budget_type)) {
    return 'Please select a valid pricing type.'
  }
  if (input.teaching_location && !isValidTeachingLocation(input.teaching_location)) {
    return 'Invalid teaching location preference.'
  }
  if (!Array.isArray(input.availability) || input.availability.length === 0) {
    return 'Please provide at least one preferred availability slot.'
  }

  for (const slot of input.availability) {
    if (typeof slot.day_of_week !== 'number' || slot.day_of_week < 0 || slot.day_of_week > 6) {
      return 'Each availability slot must have a valid day of the week (Sunday to Saturday).'
    }
    if (!slot.start_time || !slot.end_time) {
      return 'Start and end times are required for all availability slots.'
    }
    if (slot.start_time >= slot.end_time) {
      return `Start time (${slot.start_time}) must be earlier than end time (${slot.end_time}).`
    }
  }

  return null
}

/**
 * Student Tutor Request Creation.
 * Derives student_id strictly from session auth.uid().
 */
export async function createStudentTutorRequest(input: CreateRequestInput): Promise<ActionResponse> {
  try {
    const user = await requireRole(['STUDENT'])
    const studentId = user.id

    const validationError = validateRequestInput(input)
    if (validationError) {
      return { error: validationError }
    }

    const supabase = await createClient()

    // 1. Re-validate tutor status server-side at submission time
    const { data: tutorProfile, error: tutorErr } = await (supabase as any)
      .from('public_tutor_profiles')
      .select('teacher_id')
      .eq('teacher_id', input.teacher_id)
      .maybeSingle()

    if (tutorErr || !tutorProfile) {
      return { error: 'This tutor is no longer available or verified for new requests.' }
    }

    // 2. Encode teaching location preference inside the message column
    const encodedMessage = encodeRequestMessage(input.teaching_location, input.message)

    // 3. Insert tutor_request
    const { data: requestRow, error: insertErr } = await (supabase as any)
      .from('tutor_requests')
      .insert({
        student_id: studentId,
        parent_id: null,
        teacher_id: input.teacher_id,
        subject_id: input.subject_id,
        class_id: input.class_id,
        board_id: input.board_id,
        locality_id: input.locality_id,
        budget_amount: input.budget_amount,
        budget_type: input.budget_type,
        message: encodedMessage,
        status: 'PENDING',
      })
      .select('id')
      .single()

    if (insertErr || !requestRow) {
      console.error('Error inserting student tutor request:', insertErr)
      return { error: 'Failed to create tutor request. Please try again.' }
    }

    const requestId = requestRow.id

    // 4. Insert availability slots
    const availabilityPayload = input.availability.map(slot => ({
      request_id: requestId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.length === 5 ? `${slot.start_time}:00` : slot.start_time,
      end_time: slot.end_time.length === 5 ? `${slot.end_time}:00` : slot.end_time,
    }))

    const { error: availErr } = await (supabase as any)
      .from('request_availability')
      .insert(availabilityPayload)

    if (availErr) {
      console.error('Error inserting availability slots:', availErr)
      // Atomicity fallback: Transition request to CANCELLED to prevent orphaned incomplete PENDING requests
      await (supabase as any)
        .from('tutor_requests')
        .update({ status: 'CANCELLED' })
        .eq('id', requestId)

      return {
        error: 'Failed to record your preferred availability schedule. The request has been cancelled. Please try again.',
      }
    }

    revalidatePath('/dashboard/student/requests')
    return { success: true, requestId }
  } catch (err) {
    console.error('Unexpected error in createStudentTutorRequest:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Parent Tutor Request Creation.
 * Derives parent_id strictly from session auth.uid().
 * Verifies selected student_id is linked via parent_students table.
 */
export async function createParentTutorRequest(input: CreateRequestInput): Promise<ActionResponse> {
  try {
    const user = await requireRole(['PARENT'])
    const parentId = user.id

    if (!input.student_id) {
      return { error: 'Please select a student for this request.' }
    }

    const validationError = validateRequestInput(input)
    if (validationError) {
      return { error: validationError }
    }

    const supabase = await createClient()

    // 1. Verify that selected student is linked through parent_students
    const { data: linkRecord, error: linkErr } = await (supabase as any)
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', parentId)
      .eq('student_id', input.student_id)
      .maybeSingle()

    if (linkErr || !linkRecord) {
      return { error: 'The selected student is not linked to your parent account.' }
    }

    // 2. Re-validate tutor status server-side at submission time
    const { data: tutorProfile, error: tutorErr } = await (supabase as any)
      .from('public_tutor_profiles')
      .select('teacher_id')
      .eq('teacher_id', input.teacher_id)
      .maybeSingle()

    if (tutorErr || !tutorProfile) {
      return { error: 'This tutor is no longer available or verified for new requests.' }
    }

    // 3. Encode teaching location preference inside the message column
    const encodedMessage = encodeRequestMessage(input.teaching_location, input.message)

    // 4. Insert tutor_request
    const { data: requestRow, error: insertErr } = await (supabase as any)
      .from('tutor_requests')
      .insert({
        student_id: input.student_id,
        parent_id: parentId,
        teacher_id: input.teacher_id,
        subject_id: input.subject_id,
        class_id: input.class_id,
        board_id: input.board_id,
        locality_id: input.locality_id,
        budget_amount: input.budget_amount,
        budget_type: input.budget_type,
        message: encodedMessage,
        status: 'PENDING',
      })
      .select('id')
      .single()

    if (insertErr || !requestRow) {
      console.error('Error inserting parent tutor request:', insertErr)
      return { error: 'Failed to create tutor request. Please try again.' }
    }

    const requestId = requestRow.id

    // 5. Insert availability slots
    const availabilityPayload = input.availability.map(slot => ({
      request_id: requestId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.length === 5 ? `${slot.start_time}:00` : slot.start_time,
      end_time: slot.end_time.length === 5 ? `${slot.end_time}:00` : slot.end_time,
    }))

    const { error: availErr } = await (supabase as any)
      .from('request_availability')
      .insert(availabilityPayload)

    if (availErr) {
      console.error('Error inserting availability slots:', availErr)
      // Atomicity fallback: Transition request to CANCELLED
      await (supabase as any)
        .from('tutor_requests')
        .update({ status: 'CANCELLED' })
        .eq('id', requestId)

      return {
        error: 'Failed to record your preferred availability schedule. The request has been cancelled. Please try again.',
      }
    }

    revalidatePath('/dashboard/parent/requests')
    return { success: true, requestId }
  } catch (err) {
    console.error('Unexpected error in createParentTutorRequest:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Cancel an existing request.
 * Authorized for:
 * - Student/Parent: when PENDING or ACCEPTED
 * - Teacher: ONLY when ACCEPTED (Teachers cannot cancel PENDING requests)
 */
export async function cancelTutorRequest(requestId: string): Promise<ActionResponse> {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Fetch the request to verify current status and participant ownership
    const { data: requestRow, error: fetchErr } = await (supabase as any)
      .from('tutor_requests')
      .select('id, status, student_id, parent_id, teacher_id')
      .eq('id', requestId)
      .maybeSingle()

    if (fetchErr || !requestRow) {
      return { error: 'Request not found.' }
    }

    const isStudent = requestRow.student_id === user.id
    const isParent = requestRow.parent_id === user.id
    const isTeacher = requestRow.teacher_id === user.id

    if (!isStudent && !isParent && !isTeacher) {
      return { error: 'You are not authorized to cancel this request.' }
    }

    // Teacher cannot cancel a PENDING request
    if (isTeacher && !isStudent && !isParent && requestRow.status === 'PENDING') {
      return { error: 'Teachers cannot cancel a pending request. Please decline it instead.' }
    }

    if (requestRow.status !== 'PENDING' && requestRow.status !== 'ACCEPTED') {
      return { error: `Cannot cancel a request that is currently ${requestRow.status}.` }
    }

    // Execute cancellation (enforced by DB trigger as well)
    const { error: updateErr } = await (supabase as any)
      .from('tutor_requests')
      .update({ status: 'CANCELLED' })
      .eq('id', requestId)

    if (updateErr) {
      console.error('Error cancelling tutor request:', updateErr)
      return { error: 'Failed to cancel request.' }
    }

    revalidatePath('/dashboard/student/requests')
    revalidatePath(`/dashboard/student/requests/${requestId}`)
    revalidatePath('/dashboard/parent/requests')
    revalidatePath(`/dashboard/parent/requests/${requestId}`)
    revalidatePath('/dashboard/teacher/requests')
    revalidatePath(`/dashboard/teacher/requests/${requestId}`)
    return { success: true }
  } catch (err) {
    console.error('Unexpected error in cancelTutorRequest:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

/**
 * Teacher accepts a PENDING request.
 */
export async function acceptTutorRequest(requestId: string): Promise<ActionResponse> {
  try {
    const user = await requireRole(['TEACHER'])
    const supabase = await createClient()

    const { data: requestRow, error: fetchErr } = await (supabase as any)
      .from('tutor_requests')
      .select('id, status, teacher_id')
      .eq('id', requestId)
      .maybeSingle()

    if (fetchErr || !requestRow) {
      return { error: 'Request not found.' }
    }

    if (requestRow.teacher_id !== user.id) {
      return { error: 'You are not authorized to accept this request.' }
    }

    if (requestRow.status !== 'PENDING') {
      return { error: `Cannot accept a request that is currently ${requestRow.status}.` }
    }

    const { error: updateErr } = await (supabase as any)
      .from('tutor_requests')
      .update({ status: 'ACCEPTED' })
      .eq('id', requestId)

    if (updateErr) {
      console.error('Error accepting tutor request:', updateErr)
      return { error: 'Failed to accept request.' }
    }

    revalidatePath('/dashboard/teacher/requests')
    revalidatePath(`/dashboard/teacher/requests/${requestId}`)
    return { success: true }
  } catch (err) {
    console.error('Unexpected error in acceptTutorRequest:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

/**
 * Teacher declines a PENDING request.
 */
export async function declineTutorRequest(requestId: string): Promise<ActionResponse> {
  try {
    const user = await requireRole(['TEACHER'])
    const supabase = await createClient()

    const { data: requestRow, error: fetchErr } = await (supabase as any)
      .from('tutor_requests')
      .select('id, status, teacher_id')
      .eq('id', requestId)
      .maybeSingle()

    if (fetchErr || !requestRow) {
      return { error: 'Request not found.' }
    }

    if (requestRow.teacher_id !== user.id) {
      return { error: 'You are not authorized to decline this request.' }
    }

    if (requestRow.status !== 'PENDING') {
      return { error: `Cannot decline a request that is currently ${requestRow.status}.` }
    }

    const { error: updateErr } = await (supabase as any)
      .from('tutor_requests')
      .update({ status: 'DECLINED' })
      .eq('id', requestId)

    if (updateErr) {
      console.error('Error declining tutor request:', updateErr)
      return { error: 'Failed to decline request.' }
    }

    revalidatePath('/dashboard/teacher/requests')
    revalidatePath(`/dashboard/teacher/requests/${requestId}`)
    return { success: true }
  } catch (err) {
    console.error('Unexpected error in declineTutorRequest:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

/**
 * Completes an ACCEPTED request.
 * Authorized for: Teacher, Parent, or Student on the engagement.
 */
export async function completeTutorRequest(requestId: string): Promise<ActionResponse> {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data: requestRow, error: fetchErr } = await (supabase as any)
      .from('tutor_requests')
      .select('id, status, student_id, parent_id, teacher_id')
      .eq('id', requestId)
      .maybeSingle()

    if (fetchErr || !requestRow) {
      return { error: 'Request not found.' }
    }

    const isParticipant =
      requestRow.student_id === user.id ||
      requestRow.parent_id === user.id ||
      requestRow.teacher_id === user.id

    if (!isParticipant) {
      return { error: 'You are not authorized to complete this request.' }
    }

    if (requestRow.status !== 'ACCEPTED') {
      return { error: `Cannot complete a request that is currently ${requestRow.status}.` }
    }

    const { error: updateErr } = await (supabase as any)
      .from('tutor_requests')
      .update({ status: 'COMPLETED' })
      .eq('id', requestId)

    if (updateErr) {
      console.error('Error completing tutor request:', updateErr)
      return { error: 'Failed to complete request.' }
    }

    revalidatePath('/dashboard/student/requests')
    revalidatePath(`/dashboard/student/requests/${requestId}`)
    revalidatePath('/dashboard/parent/requests')
    revalidatePath(`/dashboard/parent/requests/${requestId}`)
    revalidatePath('/dashboard/teacher/requests')
    revalidatePath(`/dashboard/teacher/requests/${requestId}`)
    return { success: true }
  } catch (err) {
    console.error('Unexpected error in completeTutorRequest:', err)
    return { error: 'An unexpected error occurred.' }
  }
}
