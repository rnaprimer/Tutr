'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database'

export async function login(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Fetch the role to route appropriately
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()) as any

  const { data: admin } = (await supabase
    .from('admin_users')
    .select('role')
    .eq('id', data.user.id)
    .single()) as any

  if (admin) {
    redirect('/admin')
  } else if (profile) {
    if (profile.role === 'STUDENT') redirect('/dashboard/student')
    if (profile.role === 'PARENT') redirect('/dashboard/parent')
    if (profile.role === 'TEACHER') redirect('/dashboard/teacher')
  }

  // If no profile exists, redirect to a recovery path
  redirect('/auth/complete-profile')
}

export async function signup(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string

  if (!email || !password || !name || !role) {
    return { error: 'All fields are required.' }
  }

  if (!['STUDENT', 'PARENT', 'TEACHER'].includes(role)) {
    return { error: 'Invalid role selected.' }
  }

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (authData.user) {
    const { error: profileError } = (await supabase.from('profiles').insert({
      id: authData.user.id,
      role: role as Database['public']['Enums']['user_role'],
      display_name: name,
    } as any)) as any

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      return { 
        error: 'Account created, but profile setup failed. Please check your email to verify, then log in to complete your profile.' 
      }
    }
  }

  // After signup, standard Supabase behavior (if email confirmation is on) is to 
  // return user=null or user with incomplete session. We direct them to the verify page.
  redirect('/auth/verify')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function forgotPassword(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  if (!email) return { error: 'Email is required' }

  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password reset link sent! Check your email.' }
}

export async function resetPassword(prevState: unknown, formData: FormData) {
  const password = formData.get('password') as string
  
  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const supabase = await createClient()
  
  const { error } = await supabase.auth.updateUser({
    password
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/login?message=Password updated successfully')
}

export async function completeProfile(prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const phone = formData.get('phone') as string

  if (!name || !role) {
    return { error: 'Name and role are required.' }
  }

  if (!['STUDENT', 'PARENT', 'TEACHER'].includes(role)) {
    return { error: 'Invalid role selected.' }
  }

  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error: profileError } = (await supabase.from('profiles').insert({
    id: user.id,
      role: role as Database['public']['Enums']['user_role'],
    display_name: name,
    phone_number: phone || null,
  } as any)) as any

  if (profileError) {
    return { error: profileError.message }
  }

  if (role === 'STUDENT') redirect('/dashboard/student')
  if (role === 'PARENT') redirect('/dashboard/parent')
  if (role === 'TEACHER') redirect('/dashboard/teacher')
  redirect('/')
}
