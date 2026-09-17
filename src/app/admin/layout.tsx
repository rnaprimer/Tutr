import { requireAdmin } from '@/lib/auth/require-admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <div className="min-h-screen bg-gray-100">{children}</div>
}
