import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">404 - Not Found</h2>
      <p className="mb-8 text-gray-600 max-w-md">
        We could not find the page you were looking for. It might have been moved or does not exist.
      </p>
      <Link 
        href="/"
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Return Home
      </Link>
    </div>
  )
}
