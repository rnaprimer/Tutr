'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database'
import { calculateProfileCompleteness } from '@/lib/data/teacher-profile'

type DocumentStatus = Database['public']['Enums']['verification_status']

export async function startTeacherReview(teacherId: string) {
  await requireAdmin(['SUPER_ADMIN', 'VERIFICATION_ADMIN'])
  const supabase = await createClient()

  // Validate current status
  const profileRes = await supabase
    .from('teacher_profiles')
    .select('status')
    .eq('profile_id', teacherId)
    .single()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRes.data as any
  const profileError = profileRes.error

  if (profileError || !profile) {
    return { error: 'Teacher profile not found' }
  }

  if (profile.status !== 'SUBMITTED') {
    return { error: 'Teacher is not in SUBMITTED state' }
  }

  const { error: updateError } = await supabase
    .from('teacher_profiles')
    // @ts-expect-error: Suppress generic union inference errors from Supabase client
    .update({ 
      status: 'UNDER_REVIEW',
      updated_at: new Date().toISOString()
    })
    .eq('profile_id', teacherId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/teachers')
  revalidatePath(`/admin/teachers/${teacherId}`)
  
  return { success: true }
}

export async function requestTeacherChanges(teacherId: string, notes: string) {
  await requireAdmin(['SUPER_ADMIN', 'VERIFICATION_ADMIN'])
  
  if (!notes || notes.trim() === '') {
    return { error: 'Admin notes are required to request changes' }
  }

  const supabase = await createClient()

  const profileRes = await supabase
    .from('teacher_profiles')
    .select('status')
    .eq('profile_id', teacherId)
    .single()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRes.data as any
  const profileError = profileRes.error

  if (profileError || !profile) {
    return { error: 'Teacher profile not found' }
  }

  if (profile.status !== 'UNDER_REVIEW') {
    return { error: 'Teacher is not UNDER_REVIEW' }
  }

  const { error: updateError } = await supabase
    .from('teacher_profiles')
    // @ts-expect-error: Suppress generic union inference errors from Supabase client
    .update({ 
      status: 'NEEDS_CHANGES',
      admin_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('profile_id', teacherId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/teachers')
  revalidatePath(`/admin/teachers/${teacherId}`)
  
  return { success: true }
}

export async function rejectTeacher(teacherId: string, reason: string) {
  await requireAdmin(['SUPER_ADMIN', 'VERIFICATION_ADMIN'])
  
  if (!reason || reason.trim() === '') {
    return { error: 'A rejection reason is required' }
  }

  const supabase = await createClient()

  const profileRes = await supabase
    .from('teacher_profiles')
    .select('status')
    .eq('profile_id', teacherId)
    .single()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRes.data as any
  const profileError = profileRes.error

  if (profileError || !profile) {
    return { error: 'Teacher profile not found' }
  }

  if (profile.status !== 'UNDER_REVIEW') {
    return { error: 'Teacher is not UNDER_REVIEW' }
  }

  const { error: updateError } = await supabase
    .from('teacher_profiles')
    // @ts-expect-error: Suppress generic union inference errors from Supabase client
    .update({ 
      status: 'REJECTED',
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('profile_id', teacherId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/teachers')
  revalidatePath(`/admin/teachers/${teacherId}`)
  
  return { success: true }
}

export async function verifyTeacher(teacherId: string) {
  await requireAdmin(['SUPER_ADMIN', 'VERIFICATION_ADMIN'])
  const supabase = await createClient()

  const profileRes = await supabase
    .from('teacher_profiles')
    .select('status')
    .eq('profile_id', teacherId)
    .single()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRes.data as any
  const profileError = profileRes.error

  if (profileError || !profile) {
    return { error: 'Teacher profile not found' }
  }

  if (profile.status !== 'UNDER_REVIEW') {
    return { error: 'Teacher is not UNDER_REVIEW' }
  }

  // Final server-side completeness validation
  const completeness = await calculateProfileCompleteness(teacherId)
  if (!completeness.isReadyForSubmission) {
    return { 
      error: 'Teacher does not meet all requirements for verification.',
      missing: completeness.missingFields
    }
  }

  const { error: updateError } = await supabase
    .from('teacher_profiles')
    // @ts-expect-error: Suppress generic union inference errors from Supabase client
    .update({ 
      status: 'VERIFIED',
      admin_notes: null, // Clear any previous notes upon successful verification
      rejection_reason: null,
      updated_at: new Date().toISOString()
    })
    .eq('profile_id', teacherId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/teachers')
  revalidatePath(`/admin/teachers/${teacherId}`)
  
  return { success: true }
}

export async function updateVerificationDocumentStatus(documentId: string, status: DocumentStatus) {
  await requireAdmin(['SUPER_ADMIN', 'VERIFICATION_ADMIN'])
  const supabase = await createClient()

  const docRes = await supabase
    .from('verification_documents')
    .select('id, teacher_id')
    .eq('id', documentId)
    .single()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = docRes.data as any
  const docError = docRes.error

  if (docError || !doc) {
    return { error: 'Document not found' }
  }

  const { error: updateError } = await supabase
    .from('verification_documents')
    // @ts-expect-error: Suppress generic union inference errors from Supabase client
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/admin/teachers/${doc.teacher_id}`)
  
  return { success: true }
}
