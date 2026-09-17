/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

export type PublicTutorProfile = Database['public']['Views']['public_tutor_profiles']['Row']

export interface TutorFilters {
  subject_id?: string
  class_id?: string
  board_id?: string
  locality_id?: string
  pricing_type?: string
}

export interface EnrichedTutorProfile extends PublicTutorProfile {
  subjects: { id: number; name: string }[]
  classes: { id: number; name: string }[]
  boards: { id: number; name: string }[]
  localities: { id: number; name: string; city_id: number }[]
}

export async function getFilteredTutors(filters: TutorFilters): Promise<EnrichedTutorProfile[]> {
  const supabase = await createClient()
  
  // 1. Identify filtered teacher_ids using intersection logic if taxonomies are filtered.
  let activeTeacherIds: string[] | null = null

  const intersectIds = (current: string[] | null, next: string[]) => {
    if (current === null) return next
    return current.filter(id => next.includes(id))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeMapIds = (data: any) => (data || []).map((d: any) => d.teacher_id)

  if (filters.subject_id) {
    const { data } = (await supabase.from('teacher_subjects').select('teacher_id').eq('subject_id', filters.subject_id)) as any
    activeTeacherIds = intersectIds(activeTeacherIds, safeMapIds(data))
  }

  if (filters.class_id) {
    const { data } = (await supabase.from('teacher_classes').select('teacher_id').eq('class_id', filters.class_id)) as any
    activeTeacherIds = intersectIds(activeTeacherIds, safeMapIds(data))
  }

  if (filters.board_id) {
    const { data } = (await supabase.from('teacher_boards').select('teacher_id').eq('board_id', filters.board_id)) as any
    activeTeacherIds = intersectIds(activeTeacherIds, safeMapIds(data))
  }

  if (filters.locality_id) {
    const { data } = (await supabase.from('teacher_localities').select('teacher_id').eq('locality_id', filters.locality_id)) as any
    activeTeacherIds = intersectIds(activeTeacherIds, safeMapIds(data))
  }

  // If there are filters and intersection is empty, we return early
  if (activeTeacherIds !== null && activeTeacherIds.length === 0) {
    return []
  }

  // 2. Fetch the public profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('public_tutor_profiles').select('*')

  if (activeTeacherIds !== null) {
    query = query.in('teacher_id', activeTeacherIds)
  }

  if (filters.pricing_type) {
    query = query.eq('pricing_type', filters.pricing_type)
  }

  const { data: rawProfiles, error } = await query
  const profiles = rawProfiles as PublicTutorProfile[]

  if (error || !profiles || profiles.length === 0) {
    return []
  }

  // 3. Fetch taxonomies for these verified teachers
  const teacherIds = profiles.map(p => p.teacher_id!)

  const [
    { data: subjectsRel },
    { data: classesRel },
    { data: boardsRel },
    { data: localitiesRel }
  ] = await Promise.all([
    supabase.from('teacher_subjects').select('teacher_id, subjects(*)').in('teacher_id', teacherIds) as any,
    supabase.from('teacher_classes').select('teacher_id, classes(*)').in('teacher_id', teacherIds) as any,
    supabase.from('teacher_boards').select('teacher_id, boards(*)').in('teacher_id', teacherIds) as any,
    supabase.from('teacher_localities').select('teacher_id, localities(*)').in('teacher_id', teacherIds) as any
  ])

  // Map relationships
  const enriched: EnrichedTutorProfile[] = profiles.map(p => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tSubjects = (subjectsRel || []).filter((r: any) => r.teacher_id === p.teacher_id).map((r: any) => r.subjects).filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tClasses = (classesRel || []).filter((r: any) => r.teacher_id === p.teacher_id).map((r: any) => r.classes).filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tBoards = (boardsRel || []).filter((r: any) => r.teacher_id === p.teacher_id).map((r: any) => r.boards).filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tLocalities = (localitiesRel || []).filter((r: any) => r.teacher_id === p.teacher_id).map((r: any) => r.localities).filter(Boolean)

    return {
      ...p,
      subjects: tSubjects,
      classes: tClasses,
      boards: tBoards,
      localities: tLocalities
    }
  })

  return enriched
}

export async function getTutorDetails(teacherId: string): Promise<EnrichedTutorProfile | null> {
  const supabase = await createClient()

  const { data: rawTutor, error } = (await supabase
    .from('public_tutor_profiles')
    .select('*')
    .eq('teacher_id', teacherId)
    .single()) as any

  if (error || !rawTutor) {
    return null
  }

  const tutor = rawTutor as PublicTutorProfile

  // Fetch taxonomies
  const [
    { data: subjectsRel },
    { data: classesRel },
    { data: boardsRel },
    { data: localitiesRel }
  ] = await Promise.all([
    supabase.from('teacher_subjects').select('teacher_id, subjects(*)').eq('teacher_id', teacherId) as any,
    supabase.from('teacher_classes').select('teacher_id, classes(*)').eq('teacher_id', teacherId) as any,
    supabase.from('teacher_boards').select('teacher_id, boards(*)').eq('teacher_id', teacherId) as any,
    supabase.from('teacher_localities').select('teacher_id, localities(*)').eq('teacher_id', teacherId) as any
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjects = (subjectsRel || []).map((r: any) => r.subjects).filter(Boolean)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classes = (classesRel || []).map((r: any) => r.classes).filter(Boolean)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boards = (boardsRel || []).map((r: any) => r.boards).filter(Boolean)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localities = (localitiesRel || []).map((r: any) => r.localities).filter(Boolean)

  return {
    ...tutor,
    subjects,
    classes,
    boards,
    localities
  }
}
