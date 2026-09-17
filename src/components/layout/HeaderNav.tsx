import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { HeaderAuthControls } from './HeaderAuthControls'

export async function HeaderNav() {
  const user = await getCurrentUser()

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  const userEmail = (user?.email || '').toLowerCase()
  const isAdmin = !!user?.admin || adminEmails.includes(userEmail) || user?.profile?.role === 'ADMIN'

  const userSummary = user
    ? {
        id: user.id,
        email: user.email,
        displayName: user.profile?.display_name || user.email?.split('@')[0] || 'User',
        role: user.profile?.role || null,
        isAdmin,
        avatarUrl: user.profile?.avatar_url || null,
      }
    : null

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-blue-600 hover:opacity-90">
            Tutr
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/tutors" className="hover:text-blue-600 transition-colors">
              Find Tutors
            </Link>
            {userSummary?.isAdmin && (
              <Link href="/admin/teachers" className="text-purple-700 font-semibold hover:text-purple-900 transition-colors flex items-center gap-1">
                <span>Verification Queue</span>
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <HeaderAuthControls user={userSummary} />
        </div>
      </div>
    </header>
  )
}
