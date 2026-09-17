/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type TeacherStatus = Database['public']['Enums']['teacher_status']

export interface ProfileCompleteness {
  percentage: number
  missingFields: string[]
  completedSections: string[]
  isReadyForSubmission: boolean
  nextAction: string | null
}

export async function getTeacherOnboardingData(teacherId: string) {
  const supabase = await createClient()

  // 1. Basic Info (from profiles)
  const { data: profile } = (await supabase
    .from('profiles')
    .select('display_name, phone_number, avatar_url')
    .eq('id', teacherId)
    .single()) as any

  // 2. Teaching Info & Pricing (from teacher_profiles)
  const { data: teacherProfile } = (await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('profile_id', teacherId)
    .single()) as any

  // 3. Taxonomies
  const { data: subjects } = (await supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', teacherId)) as any
  const { data: classes } = (await supabase.from('teacher_classes').select('class_id').eq('teacher_id', teacherId)) as any
  const { data: boards } = (await supabase.from('teacher_boards').select('board_id').eq('teacher_id', teacherId)) as any
  const { data: localities } = (await supabase.from('teacher_localities').select('locality_id').eq('teacher_id', teacherId)) as any

  // 4. Availability
  const { data: availability } = (await supabase
    .from('teacher_availability')
    .select('*')
    .eq('teacher_id', teacherId)) as any

  // 5. Verification Documents
  const { data: documents } = (await supabase
    .from('verification_documents')
    .select('*')
    .eq('teacher_id', teacherId)) as any

  return {
    basicInfo: profile || { display_name: '', phone_number: null, avatar_url: null },
    teacherProfile: teacherProfile || { 
      status: 'DRAFT' as TeacherStatus, 
      bio: null, 
      teaching_location: null, 
      pricing_type: null, 
      hourly_fee: null, 
      per_class_fee: null, 
      monthly_fee: null,
      rejection_reason: null,
      admin_notes: null
    },
    subjects: subjects?.map((s: any) => s.subject_id) || [],
    classes: classes?.map((c: any) => c.class_id) || [],
    boards: boards?.map((b: any) => b.board_id) || [],
    localities: localities?.map((l: any) => l.locality_id) || [],
    availability: availability || [],
    documents: documents || [],
  }
}

export function calculateProfileCompleteness(data: any): ProfileCompleteness {
  const missingFields: string[] = []
  const completedSections: string[] = []
  let totalChecks = 0
  let passedChecks = 0
  let nextAction: string | null = null

  const check = (condition: boolean, sectionName: string, missingMessage: string, stepRoute: string) => {
    totalChecks++
    if (condition) {
      passedChecks++
      if (!completedSections.includes(sectionName)) {
        completedSections.push(sectionName)
      }
    } else {
      missingFields.push(missingMessage)
      if (!nextAction) {
        nextAction = stepRoute
      }
    }
  }

  // 1. Basic Info
  check(!!data.basicInfo.display_name && !!data.basicInfo.phone_number, 'Basic Information', 'Name and Phone Number are required', '/dashboard/teacher/onboarding/basic-info')
  
  // 2. Teaching Info
  check(!!data.teacherProfile.bio && !!data.teacherProfile.teaching_location, 'Teaching Information', 'Bio and Teaching Location are required', '/dashboard/teacher/onboarding/teaching-info')

  // 3. Subjects & Classes (Board is optional depending on class, but we just check subjects/classes)
  check(data.subjects.length > 0, 'Subjects & Classes', 'At least one Subject is required', '/dashboard/teacher/onboarding/subjects-classes')
  check(data.classes.length > 0, 'Subjects & Classes', 'At least one Class is required', '/dashboard/teacher/onboarding/subjects-classes')

  // 4. Localities
  check(data.localities.length > 0, 'Teaching Areas', 'At least one Teaching Area (Locality) is required', '/dashboard/teacher/onboarding/teaching-areas')

  // 5. Pricing
  const hasPricingType = !!data.teacherProfile.pricing_type
  let hasValidFee = false
  if (hasPricingType) {
    if (data.teacherProfile.pricing_type === 'HOURLY') hasValidFee = data.teacherProfile.hourly_fee > 0
    else if (data.teacherProfile.pricing_type === 'PER_CLASS') hasValidFee = data.teacherProfile.per_class_fee > 0
    else if (data.teacherProfile.pricing_type === 'MONTHLY') hasValidFee = data.teacherProfile.monthly_fee > 0
  }
  check(hasPricingType && hasValidFee, 'Pricing', 'Pricing Type and valid Fee are required', '/dashboard/teacher/onboarding/pricing')

  // 6. Availability
  check(data.availability.length > 0, 'Availability', 'At least one availability slot is required', '/dashboard/teacher/onboarding/availability')

  // 7. Documents (Identity is strictly required. Qualification/Experience is highly recommended but let's make at least IDENTITY required for V1)
  const hasIdentityDoc = data.documents.some((d: any) => d.category === 'IDENTITY')
  const hasQualDoc = data.documents.some((d: any) => d.category === 'QUALIFICATION')
  
  check(hasIdentityDoc, 'Documents', 'Identity Verification Document is required', '/dashboard/teacher/onboarding/documents')
  check(hasQualDoc, 'Documents', 'Qualification Document is required', '/dashboard/teacher/onboarding/documents')

  const percentage = Math.round((passedChecks / totalChecks) * 100)
  const isReadyForSubmission = passedChecks === totalChecks

  return {
    percentage,
    missingFields,
    completedSections,
    isReadyForSubmission,
    nextAction: nextAction || '/dashboard/teacher/onboarding/review'
  }
}
