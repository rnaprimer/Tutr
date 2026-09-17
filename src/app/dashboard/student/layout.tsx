import { requireRole } from '@/lib/auth/require-role'

export default async function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['STUDENT'])
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
