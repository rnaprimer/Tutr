import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type PublicTutorProfile = Database['public']['Views']['public_tutor_profiles']['Row']

export async function getVerifiedTutors(): Promise<PublicTutorProfile[]> {
  const supabase = await createClient()

  // This safely queries the public view. It will never expose private data 
  // like phone numbers, addresses, or verification documents because the view 
  // explicitly limits the SELECT scope.
  const { data: tutors, error } = await supabase
    .from('public_tutor_profiles')
    .select('*')

  if (error) {
    console.error('Error fetching public tutors:', error)
    return []
  }

  return tutors
}

export async function getVerifiedTutorById(teacherId: string): Promise<PublicTutorProfile | null> {
  const supabase = await createClient()

  const { data: tutor, error } = await supabase
    .from('public_tutor_profiles')
    .select('*')
    .eq('teacher_id', teacherId)
    .single()

  if (error || !tutor) {
    return null
  }

  return tutor
}
