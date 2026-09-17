import Link from 'next/link'

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Check Your Email</h2>
        <p className="mb-8 text-gray-600">
          We&apos;ve sent you a verification link. Please check your email and click the link to verify your account.
        </p>
        <Link 
          href="/login"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Return to Login
        </Link>
      </div>
    </div>
  )
}
