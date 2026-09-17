import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { HeaderNav } from '@/components/layout/HeaderNav'

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
      <body className="font-sans flex flex-col min-h-screen bg-white text-gray-900 antialiased">
        <HeaderNav />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}
