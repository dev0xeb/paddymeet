'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100">
            <span className="text-4xl">⚠️</span>
          </div>

          <div className="text-8xl font-extrabold text-gray-100 tracking-tight mb-2">500</div>

          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-3">
            Something went wrong
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            We hit an unexpected error. This has been logged and our team will look into it. Try refreshing the page or go back home.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors w-full sm:w-auto justify-center"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <Link href="/"
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-orange-300 hover:text-orange-500 transition-colors w-full sm:w-auto justify-center">
              <ArrowLeft className="w-4 h-4" /> Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}