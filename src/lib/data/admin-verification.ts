/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type TeacherStatus = Database['public']['Enums']['teacher_status']

export async function getDashboardStats(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const statuses: TeacherStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CHANGES', 'VERIFIED', 'REJECTED']
  
  const stats: Record<string, number> = {
    'SUBMITTED': 0,
    'UNDER_REVIEW': 0,
    'NEEDS_CHANGES': 0,
    'VERIFIED': 0,
    'REJECTED': 0
  }
  
  const countPromises = statuses.map(async (status) => {
    const res = await supabase
      .from('teacher_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
    return { status, count: res.count || 0 }
  })

  const results = await Promise.all(countPromises)
  results.forEach((res) => {
    stats[res.status] = res.count
  })

  return stats
}

export async function getVerificationQueue(): Promise<any[]> {
  const supabase = await createClient()

  const res = await supabase
    .from('teacher_profiles')
    .select(`
      profile_id,
      status,
      updated_at,
      profiles (
        display_name
      ),
      teacher_subjects (
        subject:subjects(name)
      ),
      teacher_classes (
        class:classes(name)
      ),
      teacher_localities (
        locality:localities(name)
      )
    `)
    .in('status', ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CHANGES'])
    .order('updated_at', { ascending: false })

  if (res.error) {
    console.error('Error fetching verification queue:', res.error)
    return []
  }

  return res.data || []
}

export async function getTeacherApplication(teacherId: string): Promise<any> {
  const supabase = await createClient()

  const profileRes = await supabase
    .from('profiles')
    .select('*')
    .eq('id', teacherId)
    .single()

  const teacherProfileRes = await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('profile_id', teacherId)
    .single()

  const subjectsRes = await supabase
    .from('teacher_subjects')
    .select('subject:subjects(*)')
    .eq('teacher_id', teacherId)

  const classesRes = await supabase
    .from('teacher_classes')
    .select('class:classes(*)')
    .eq('teacher_id', teacherId)

  const boardsRes = await supabase
    .from('teacher_boards')
    .select('board:boards(*)')
    .eq('teacher_id', teacherId)

  const localitiesRes = await supabase
    .from('teacher_localities')
    .select('locality:localities(*)')
    .eq('teacher_id', teacherId)

  const availabilityRes = await supabase
    .from('teacher_availability')
    .select('*')
    .eq('teacher_id', teacherId)

  return {
    profile: profileRes.data,
    teacherProfile: teacherProfileRes.data,
    subjects: (subjectsRes.data || []).map((s: any) => s.subject),
    classes: (classesRes.data || []).map((c: any) => c.class),
    boards: (boardsRes.data || []).map((b: any) => b.board),
    localities: (localitiesRes.data || []).map((l: any) => l.locality),
    availability: availabilityRes.data || []
  }
}

export async function getTeacherVerificationDocuments(teacherId: string): Promise<any[]> {
  const supabase = await createClient()

  const res = await supabase
    .from('verification_documents')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: true })

  if (res.error) {
    console.error('Error fetching verification documents:', res.error)
    return []
  }

  const documents = res.data || []

  const documentsWithUrls = await Promise.all(
    documents.map(async (doc: any) => {
      const { data: signedUrlData } = await supabase.storage
        .from('verification_documents')
        .createSignedUrl(doc.file_path, 3600)

      return {
        ...doc,
        signed_url: signedUrlData?.signedUrl || null
      }
    })
  )

  return documentsWithUrls
}
