/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type UserRole = Database['public']['Enums']['user_role']
const ALLOWED_SIGNUP_ROLES: UserRole[] = ['STUDENT', 'PARENT', 'TEACHER']

function getSafeRedirect(next: string | null, fallback: string): string {
  if (!next) return fallback
  // Strictly prevent open redirects: must start with single '/', not '//' or '/\', and contain no protocol or backslashes
  if (
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.startsWith('/\\') &&
    !next.includes('://') &&
    !next.includes('\\')
  ) {
    return next
  }
  return fallback
}

function getRoleDashboard(role: string): string {
  switch (role) {
    case 'STUDENT':
      return '/dashboard/student'
    case 'PARENT':
      return '/dashboard/parent'
    case 'TEACHER':
      return '/dashboard/teacher'
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin'
    default:
      return '/'
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const roleParam = searchParams.get('role')?.toUpperCase()
  const rawNext = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Authentication code missing')}`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('OAuth exchange error:', exchangeError)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Could not authenticate with Google')}`)
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Could not retrieve user session')}`)
  }

  // 1. Check existing profile (Existing role ALWAYS wins)
  const { data: existingProfile } = (await supabase
    .from('profiles')
    .select('id, role, display_name')
    .eq('id', user.id)
    .maybeSingle()) as any

  const { data: adminUser } = (await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()) as any

  // Sanitize roleParam: treat client role strictly as untrusted intent; allow ONLY non-admin public roles
  const targetRole = roleParam && ALLOWED_SIGNUP_ROLES.includes(roleParam as UserRole)
    ? (roleParam as UserRole)
    : null

  // 2. Existing User Flow
  if (existingProfile) {
    // If user entered a role-specific flow that conflicts with their established role:
    if (targetRole && existingProfile.role !== targetRole) {
      const fallbackUrl = getRoleDashboard(existingProfile.role)
      const message = `You are signed in to your existing ${existingProfile.role.toLowerCase()} account. Your account role has been preserved.`
      return NextResponse.redirect(`${origin}${fallbackUrl}?message=${encodeURIComponent(message)}`)
    }

    if (adminUser) {
      return NextResponse.redirect(`${origin}${getSafeRedirect(rawNext, '/admin')}`)
    }

    return NextResponse.redirect(`${origin}${getSafeRedirect(rawNext, getRoleDashboard(existingProfile.role))}`)
  }

  // 3. New User Flow (No profile exists)
  // If no legitimate target role was specified (e.g. login from /login or illegal role requested):
  if (!targetRole) {
    return NextResponse.redirect(`${origin}/auth/complete-profile`)
  }

  // Derive profile metadata
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    (targetRole === 'TEACHER' ? 'Teacher' : targetRole === 'PARENT' ? 'Parent' : 'Student')

  const avatarUrl = user.user_metadata?.avatar_url || null

  // Idempotent profile creation: check again in case of rapid concurrent callbacks
  const { data: doubleCheckProfile } = (await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()) as any

  if (!doubleCheckProfile) {
    const { error: profileError } = (await supabase.from('profiles').insert({
      id: user.id,
      role: targetRole,
      display_name: displayName,
      avatar_url: avatarUrl,
    } as any)) as any

    if (profileError) {
      console.error('Failed to create profile during OAuth callback:', profileError)
      return NextResponse.redirect(`${origin}/auth/complete-profile?error=${encodeURIComponent('Profile creation failed')}`)
    }
  }

  // If role is TEACHER: Idempotently create teacher_profiles with status DRAFT
  if (targetRole === 'TEACHER') {
    const { data: existingTp } = (await supabase
      .from('teacher_profiles')
      .select('profile_id')
      .eq('profile_id', user.id)
      .maybeSingle()) as any

    if (!existingTp) {
      await supabase.from('teacher_profiles').insert({
        profile_id: user.id,
        status: 'DRAFT', // Never automatically set VERIFIED
      } as any)
    }

    return NextResponse.redirect(`${origin}${getSafeRedirect(rawNext, '/dashboard/teacher')}`)
  }

  if (targetRole === 'STUDENT') {
    return NextResponse.redirect(`${origin}${getSafeRedirect(rawNext, '/dashboard/student')}`)
  }

  if (targetRole === 'PARENT') {
    return NextResponse.redirect(`${origin}${getSafeRedirect(rawNext, '/dashboard/parent')}`)
  }

  return NextResponse.redirect(`${origin}${getSafeRedirect(rawNext, '/')}`)
}
