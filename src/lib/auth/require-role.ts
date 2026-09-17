import { redirect } from 'next/navigation'
import { requireAuth } from './require-auth'
import { Database } from '@/types/database'

type Role = Database['public']['Enums']['user_role']

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth()
  
  if (!user.profile || !allowedRoles.includes(user.profile.role)) {
    redirect('/unauthorized')
  }
  
  return user
}
