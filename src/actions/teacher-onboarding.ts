'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTeacherOnboardingData, calculateProfileCompleteness } from '@/lib/data/teacher-profile'
import { Database } from '@/types/database'

export async function saveBasicInformation(formData: FormData) {
  const user = await requireRole(['TEACHER'])
  const display_name = formData.get('display_name') as string
  const phone_number = formData.get('phone_number') as string

  if (!display_name) return { error: 'Name is required' }

  const supabase = await createClient()
  
  const { error } = (await supabase
    .from('profiles')
  // @ts-ignore
    .update({ display_name, phone_number })
    .eq('id', user.id))

  if (error) return { error: error.message }
  
  // Also ensure teacher_profiles exists
  const { data: tp } = (await supabase.from('teacher_profiles').select('profile_id').eq('profile_id', user.id).maybeSingle())
  if (!tp) {
  // @ts-ignore
    await supabase.from('teacher_profiles').insert({ profile_id: user.id, status: 'DRAFT' })
  }

  revalidatePath('/dashboard/teacher', 'layout')
  redirect('/dashboard/teacher/onboarding/teaching-info')
}

export async function saveTeachingInformation(formData: FormData) {
  const user = await requireRole(['TEACHER'])
  const bio = formData.get('bio') as string
  const teaching_location = formData.get('teaching_location') as Database['public']['Enums']['teaching_location']

  if (!bio) return { error: 'Bio is required' }
  if (!['STUDENT_HOME', 'TEACHER_LOCATION', 'BOTH'].includes(teaching_location)) return { error: 'Invalid location selected' }

  const supabase = await createClient()

  const { error } = (await supabase
    .from('teacher_profiles')
  // @ts-ignore
    .update({ bio, teaching_location })
    .eq('profile_id', user.id))

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/teacher', 'layout')
  redirect('/dashboard/teacher/onboarding/subjects-classes')
}

export async function saveTaxonomies(formData: FormData) {
  const user = await requireRole(['TEACHER'])
  const subjects = formData.getAll('subjects').map(s => parseInt(s as string))
  const classes = formData.getAll('classes').map(c => parseInt(c as string))
  const boards = formData.getAll('boards').map(b => parseInt(b as string))

  if (subjects.length === 0 || classes.length === 0) {
    return { error: 'Please select at least one subject and one class.' }
  }

  const supabase = await createClient()

  // Idempotent replace: delete existing then insert new
  await supabase.from('teacher_subjects').delete().eq('teacher_id', user.id)
  await supabase.from('teacher_classes').delete().eq('teacher_id', user.id)
  await supabase.from('teacher_boards').delete().eq('teacher_id', user.id)

  if (subjects.length > 0) {
  // @ts-ignore
    await supabase.from('teacher_subjects').insert(subjects.map(subject_id => ({ teacher_id: user.id, subject_id })))
  }
  if (classes.length > 0) {
  // @ts-ignore
    await supabase.from('teacher_classes').insert(classes.map(class_id => ({ teacher_id: user.id, class_id })))
  }
  if (boards.length > 0) {
  // @ts-ignore
    await supabase.from('teacher_boards').insert(boards.map(board_id => ({ teacher_id: user.id, board_id })))
  }

  revalidatePath('/dashboard/teacher', 'layout')
  redirect('/dashboard/teacher/onboarding/teaching-areas')
}

export async function saveTeachingAreas(formData: FormData) {
  const user = await requireRole(['TEACHER'])
  const localities = formData.getAll('localities').map(l => parseInt(l as string))

  if (localities.length === 0) return { error: 'Please select at least one locality' }

  const supabase = await createClient()

  await supabase.from('teacher_localities').delete().eq('teacher_id', user.id)
  
  const { error } = (await supabase.from('teacher_localities').insert(
    localities.map(locality_id => ({ teacher_id: user.id, locality_id })) as any
  ))

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/teacher', 'layout')
  redirect('/dashboard/teacher/onboarding/pricing')
}

export async function savePricing(formData: FormData) {
  const user = await requireRole(['TEACHER'])
  const pricing_type = formData.get('pricing_type') as Database['public']['Enums']['pricing_type']
  
  let hourly_fee = null
  let per_class_fee = null
  let monthly_fee = null

  if (pricing_type === 'HOURLY') {
    hourly_fee = parseInt(formData.get('fee') as string)
  } else if (pricing_type === 'PER_CLASS') {
    per_class_fee = parseInt(formData.get('fee') as string)
  } else if (pricing_type === 'MONTHLY') {
    monthly_fee = parseInt(formData.get('fee') as string)
  } else {
    return { error: 'Invalid pricing type' }
  }

  if (
    (hourly_fee !== null && (isNaN(hourly_fee) || hourly_fee <= 0)) ||
    (per_class_fee !== null && (isNaN(per_class_fee) || per_class_fee <= 0)) ||
    (monthly_fee !== null && (isNaN(monthly_fee) || monthly_fee <= 0))
  ) {
    return { error: 'Fee must be a valid positive number' }
  }

  const supabase = await createClient()

  const { error } = (await supabase
    .from('teacher_profiles')
  // @ts-ignore
    .update({ pricing_type, hourly_fee, per_class_fee, monthly_fee })
    .eq('profile_id', user.id))

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/teacher', 'layout')
  redirect('/dashboard/teacher/onboarding/availability')
}

export async function addAvailability(formData: FormData) {
  const user = await requireRole(['TEACHER'])
  const day_of_week = parseInt(formData.get('day_of_week') as string)
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string

  if (isNaN(day_of_week) || !start_time || !end_time) return { error: 'All fields required' }

  if (start_time >= end_time) return { error: 'End time must be after start time' }

  const supabase = await createClient()
  
  // @ts-ignore
  const { error } = (await supabase.from('teacher_availability').insert({
    teacher_id: user.id,
    day_of_week,
    start_time,
    end_time,
    is_active: true
  } as any))

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/teacher/onboarding/availability')
  return { success: 'Added successfully' }
}

export async function deleteAvailability(formData: FormData) {
  const user = await requireRole(['TEACHER'])
  const id = formData.get('id') as string

  const supabase = await createClient()
  
  const { error } = (await supabase
    .from('teacher_availability')
    .delete()
    .eq('id', id)
    .eq('teacher_id', user.id))

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/teacher/onboarding/availability')
  return { success: 'Deleted successfully' }
}

export async function completeAvailability() {
  // Simple redirect to next step
  revalidatePath('/dashboard/teacher', 'layout')
  redirect('/dashboard/teacher/onboarding/documents')
}

export async function uploadVerificationDocument(formData: FormData) {
  try {
    const user = await requireRole(['TEACHER'])
    const file = formData.get('file') as File
    const category = formData.get('category') as Database['public']['Enums']['verification_category']

    if (!file || file.size === 0) return { error: 'File is required' }
    if (!['IDENTITY', 'QUALIFICATION', 'EXPERIENCE'].includes(category)) return { error: 'Invalid category' }
    
    if (file.size > 5 * 1024 * 1024) return { error: 'File size must be under 5MB' }

    const supabase = await createClient()

    // Generate secure path: [teacher_id]/[category]/[timestamp]_[filename]
    const timestamp = Date.now()
    const sanitizedFileName = (file.name || 'document').replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${user.id}/${category}/${timestamp}_${sanitizedFileName}`

    // Read file bytes as Buffer for reliable transmission in Node runtime
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 1. Upload to storage bucket using user's authenticated session
    const { error: uploadError } = await supabase.storage
      .from('verification_documents')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (uploadError) return { error: `Upload failed: ${uploadError.message}` }

    // 2. Insert into database
    // @ts-ignore
    const { error: dbError } = (await supabase.from('verification_documents').insert({
      teacher_id: user.id,
      category,
      file_path: filePath,
      status: 'PENDING'
    } as any))

    if (dbError) {
      // Attempt rollback of storage file
      await supabase.storage.from('verification_documents').remove([filePath])
      return { error: 'Failed to record document in database' }
    }

    revalidatePath('/dashboard/teacher', 'layout')
    revalidatePath('/dashboard/teacher/onboarding/documents')
    return { success: 'Document uploaded' }
  } catch (err: any) {
    console.error('uploadVerificationDocument error:', err)
    return { error: err?.message || 'Upload failed. Please try again with a file under 5MB.' }
  }
}

export async function deleteVerificationDocument(formData: FormData) {
  try {
    const user = await requireRole(['TEACHER'])
    const id = formData.get('id') as string
    const filePath = formData.get('file_path') as string

    if (!id || !filePath) return { error: 'Invalid request' }

    const supabase = await createClient()

    // Verify ownership before deleting
    const { data: doc } = (await supabase.from('verification_documents').select('teacher_id').eq('id', id).single()) as any
    if (doc?.teacher_id !== user.id) return { error: 'Unauthorized' }

    // 1. Delete from database first
    const { error: dbError } = (await supabase.from('verification_documents').delete().eq('id', id).eq('teacher_id', user.id))
    
    if (dbError) return { error: 'Failed to delete record' }

    // 2. Delete from storage
    await supabase.storage.from('verification_documents').remove([filePath])

    revalidatePath('/dashboard/teacher', 'layout')
    revalidatePath('/dashboard/teacher/onboarding/documents')
    return { success: 'Deleted successfully' }
  } catch (err: any) {
    console.error('deleteVerificationDocument error:', err)
    return { error: err?.message || 'Failed to delete document.' }
  }
}

export async function completeDocuments() {
  revalidatePath('/dashboard/teacher', 'layout')
  redirect('/dashboard/teacher/onboarding/review')
}

export async function submitTeacherForVerification(_formData?: FormData) {
  const user = await requireRole(['TEACHER'])
  const data = await getTeacherOnboardingData(user.id)
  
  const completeness = calculateProfileCompleteness(data)

  if (!completeness.isReadyForSubmission) {
    return { error: 'Please complete all required sections before submitting.' }
  }

  // Verify eligible status transition
  const currentStatus = data.teacherProfile.status
  if (!['DRAFT', 'NEEDS_CHANGES'].includes(currentStatus)) {
    return { error: `Profile cannot be submitted from status: ${currentStatus}` }
  }

  const supabase = await createClient()

  // Update status
  const { error } = (await supabase
    .from('teacher_profiles')
  // @ts-ignore
    .update({ status: 'SUBMITTED' })
    .eq('profile_id', user.id))

  if (error) return { error: error.message }

  revalidatePath('/dashboard/teacher', 'layout')
  redirect('/dashboard/teacher')
}
