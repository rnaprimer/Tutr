import { redirect } from 'next/navigation'
import { requireAuth } from './require-auth'
import { Database } from '@/types/database'

type AdminRole = Database['public']['Enums']['admin_role']

export async function requireAdmin(allowedAdminRoles?: AdminRole[]) {
  const user = await requireAuth()
  
  if (!user.admin) {
    redirect('/unauthorized')
  }
  
  if (allowedAdminRoles && allowedAdminRoles.length > 0) {
    if (!allowedAdminRoles.includes(user.admin.role) && user.admin.role !== 'SUPER_ADMIN') {
      redirect('/unauthorized')
    }
  }
  
  return user
}
