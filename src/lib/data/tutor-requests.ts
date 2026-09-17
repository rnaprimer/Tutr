/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { decodeRequestMessage, TeachingLocationPreference } from '@/lib/utils/teaching-location'

export type RequestStatus = Database['public']['Enums']['request_status']
export type PricingType = Database['public']['Enums']['pricing_type']

export interface RequestAvailabilitySlot {
  id: string
  request_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export interface EnrichedTutorRequest {
  id: string
  status: RequestStatus
  created_at: string
  updated_at: string
  student_id: string | null
  parent_id: string | null
  teacher_id: string | null
  subject_id: number | null
  class_id: number | null
  board_id: number | null
  locality_id: number | null
  budget_amount: number | null
  budget_type: PricingType | null
  raw_message: string | null
  teaching_location_preference: TeachingLocationPreference | null
  clean_message: string
  subject: { id: number; name: string } | null
  class: { id: number; name: string } | null
  board: { id: number; name: string } | null
  locality: { id: number; name: string } | null
  tutor: {
    teacher_id: string
    display_name: string
    avatar_url: string | null
  } | null
  student_name: string | null
  availability: RequestAvailabilitySlot[]
}

/**
 * Fetch helper to enrich requests with taxonomy, teacher public info, and availability.
 */
async function enrichRequests(
  requests: any[],
  supabase: any,
  parentStudentMap?: Map<string, string>
): Promise<EnrichedTutorRequest[]> {
  if (!requests || requests.length === 0) return []

  const requestIds = requests.map(r => r.id)
  const teacherIds = Array.from(new Set(requests.map(r => r.teacher_id).filter(Boolean))) as string[]

  // Fetch availability slots for these requests
  const { data: availabilityData } = await supabase
    .from('request_availability')
    .select('*')
    .in('request_id', requestIds)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  // Fetch public tutor profiles for display info
  let tutorMap = new Map<string, { teacher_id: string; display_name: string; avatar_url: string | null }>()
  if (teacherIds.length > 0) {
    const { data: tutors } = await supabase
      .from('public_tutor_profiles')
      .select('teacher_id, display_name, avatar_url')
      .in('teacher_id', teacherIds)

    if (tutors) {
      tutorMap = new Map(
        tutors.map((t: any) => [t.teacher_id, t])
      )
    }
  }

  const availabilityMap = new Map<string, RequestAvailabilitySlot[]>()
  if (availabilityData) {
    for (const slot of availabilityData as any[]) {
      if (!availabilityMap.has(slot.request_id)) {
        availabilityMap.set(slot.request_id, [])
      }
      availabilityMap.get(slot.request_id)!.push({
        id: slot.id,
        request_id: slot.request_id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
      })
    }
  }

  return requests.map(r => {
    const decoded = decodeRequestMessage(r.message)
    const tutorInfo = r.teacher_id ? tutorMap.get(r.teacher_id) || null : null
    const studentName = (r.student_id && parentStudentMap?.get(r.student_id)) || null

    return {
      id: r.id,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      student_id: r.student_id,
      parent_id: r.parent_id,
      teacher_id: r.teacher_id,
      subject_id: r.subject_id,
      class_id: r.class_id,
      board_id: r.board_id,
      locality_id: r.locality_id,
      budget_amount: r.budget_amount,
      budget_type: r.budget_type,
      raw_message: r.message,
      teaching_location_preference: decoded.preference,
      clean_message: decoded.message,
      subject: r.subjects || null,
      class: r.classes || null,
      board: r.boards || null,
      locality: r.localities || null,
      tutor: tutorInfo,
      student_name: studentName,
      availability: availabilityMap.get(r.id) || [],
    }
  })
}

/**
 * Get all requests for the authenticated Student (derived from auth.uid()).
 */
export async function getStudentRequests(): Promise<EnrichedTutorRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: rawRequests, error } = (await supabase
    .from('tutor_requests')
    .select(`
      id,
      status,
      created_at,
      updated_at,
      student_id,
      parent_id,
      teacher_id,
      subject_id,
      class_id,
      board_id,
      locality_id,
      budget_amount,
      budget_type,
      message,
      subjects(id, name),
      classes(id, name),
      boards(id, name),
      localities(id, name)
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })) as any

  if (error || !rawRequests) {
    return []
  }

  return enrichRequests(rawRequests, supabase)
}

/**
 * Get all requests for the authenticated Parent (derived from auth.uid()).
 */
export async function getParentRequests(): Promise<EnrichedTutorRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Fetch parent's linked students to map student names
  const { data: linkedStudents } = (await supabase
    .from('students')
    .select('id, name')) as any

  const studentMap = new Map<string, string>()
  if (linkedStudents) {
    for (const s of linkedStudents as any[]) {
      studentMap.set(s.id, s.name)
    }
  }

  const { data: rawRequests, error } = (await supabase
    .from('tutor_requests')
    .select(`
      id,
      status,
      created_at,
      updated_at,
      student_id,
      parent_id,
      teacher_id,
      subject_id,
      class_id,
      board_id,
      locality_id,
      budget_amount,
      budget_type,
      message,
      subjects(id, name),
      classes(id, name),
      boards(id, name),
      localities(id, name)
    `)
    .eq('parent_id', user.id)
    .order('created_at', { ascending: false })) as any

  if (error || !rawRequests) {
    return []
  }

  return enrichRequests(rawRequests, supabase, studentMap)
}

/**
 * Get all incoming requests for the authenticated Teacher (derived from auth.uid()).
 */
export async function getTeacherRequests(): Promise<EnrichedTutorRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: rawRequests, error } = (await supabase
    .from('tutor_requests')
    .select(`
      id,
      status,
      created_at,
      updated_at,
      student_id,
      parent_id,
      teacher_id,
      subject_id,
      class_id,
      board_id,
      locality_id,
      budget_amount,
      budget_type,
      message,
      subjects(id, name),
      classes(id, name),
      boards(id, name),
      localities(id, name)
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })) as any

  if (error || !rawRequests) {
    return []
  }

  return enrichRequests(rawRequests, supabase)
}

/**
 * Get details for a single request.
 * Securely enforces that the authenticated caller is an authorized participant (student, parent, or teacher).
 * Returns null if not found or if the user is unauthorized (clean 404 behavior, no data leak).
 */
export async function getRequestDetails(requestId: string): Promise<EnrichedTutorRequest | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !requestId) return null

  // RLS will ensure non-participants cannot read this row
  const { data: rawRequest, error } = (await supabase
    .from('tutor_requests')
    .select(`
      id,
      status,
      created_at,
      updated_at,
      student_id,
      parent_id,
      teacher_id,
      subject_id,
      class_id,
      board_id,
      locality_id,
      budget_amount,
      budget_type,
      message,
      subjects(id, name),
      classes(id, name),
      boards(id, name),
      localities(id, name)
    `)
    .eq('id', requestId)
    .maybeSingle()) as any

  if (error || !rawRequest) {
    return null
  }

  // Double-check caller authorization at application layer
  const isParticipant =
    rawRequest.student_id === user.id ||
    rawRequest.parent_id === user.id ||
    rawRequest.teacher_id === user.id

  if (!isParticipant) {
    return null
  }

  // If parent, attempt to map student name
  let studentMap: Map<string, string> | undefined
  if (rawRequest.parent_id === user.id && rawRequest.student_id) {
    const { data: student } = (await supabase
      .from('students')
      .select('id, name')
      .eq('id', rawRequest.student_id)
      .maybeSingle()) as any

    if (student) {
      studentMap = new Map([[student.id, student.name]])
    }
  }

  const enriched = await enrichRequests([rawRequest], supabase, studentMap)
  return enriched[0] || null
}
