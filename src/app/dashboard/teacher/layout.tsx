import { requireRole } from '@/lib/auth/require-role'

export default async function TeacherDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['TEACHER'])
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
