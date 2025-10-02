'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-8">An error occurred while processing your request.</p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
