import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Tutr - Hyperlocal Tutoring in Balasore',
  description: 'Discover and connect with trusted local tutors in Balasore, Odisha.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <header className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="text-xl font-bold text-blue-600">Tutr</div>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/tutors" className="hover:text-blue-600">Find Tutors</Link>
              <Link href="/login" className="hover:text-blue-600">Log in</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}
