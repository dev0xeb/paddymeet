import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Stories, guides and updates from the Paddymeet team.',
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-10 bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <Link href="/signup" className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
          Get Started
        </Link>
      </nav>

      <div className="pt-16 max-w-3xl mx-auto px-4 md:px-10 py-20 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✍️</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Paddymeet Blog</h1>
        <p className="text-gray-500 leading-relaxed mb-4">
          Stories, guides, event highlights, and updates from the Paddymeet team. Our blog is coming soon.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          We will be sharing nightlife guides, safety tips, organiser spotlights, and platform updates here very soon.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  )
}