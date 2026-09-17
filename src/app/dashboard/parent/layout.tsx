import { requireRole } from '@/lib/auth/require-role'

export default async function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['PARENT'])
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
