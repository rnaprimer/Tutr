'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/require-role'
import { revalidatePath } from 'next/cache'

export async function addStudent(prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string

  if (!name) {
    return { error: 'Student name is required.' }
  }

  // Ensure the caller is a PARENT via server-side check
  const user = await requireRole(['PARENT'])
  const parentId = user.id

  const supabase = await createClient()

  // 1. Insert into students table
  // The students table has: id, name, created_at.
  // We can let Supabase generate the ID, but we need the inserted ID to map it.
  const { data: student, error: studentError } = (await supabase
    .from('students')
    .insert({ name } as any)
    .select('id')
    .single()) as any

  if (studentError || !student) {
    console.error('Error creating student:', studentError)
    return { error: 'Failed to create student record.' }
  }

  // 2. Insert into parent_students mapping table securely utilizing the server-resolved PARENT id
  const { error: mappingError } = (await supabase
    .from('parent_students')
    .insert({
      parent_id: parentId,
      student_id: student.id,
    } as any)) as any

  if (mappingError) {
    console.error('Error creating parent_students mapping:', mappingError)
    return { error: 'Failed to link student to parent.' }
  }

  revalidatePath('/dashboard/parent')
  return { success: 'Student added successfully!' }
}

export async function getMyStudents() {
  await requireRole(['PARENT'])
  const supabase = await createClient()

  // Because RLS is properly set, a parent can only select their own students 
  // via the parent_students JOIN condition.
  const { data: students, error } = (await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })) as any

  if (error) {
    console.error('Error fetching students:', error)
    return []
  }

  return students
}
