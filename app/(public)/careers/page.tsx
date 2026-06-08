import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the Paddymeet team and help build Nigeria\'s nightlife platform.',
}

export default function CareersPage() {
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

      <div className="pt-16 max-w-3xl mx-auto px-4 md:px-10 py-20">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚀</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Join Our Team</h1>
          <p className="text-gray-500 leading-relaxed max-w-xl mx-auto">
            We are building Nigeria&apos;s leading nightlife platform and we want passionate, talented people to join us on this journey.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 text-center mb-10">
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">No open roles right now</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            We don&apos;t have any open positions at the moment but we are always interested in hearing from exceptional people. If you are passionate about technology, nightlife, and building for Nigeria — we would love to know you exist.
          </p>
          <a href="mailto:careers@paddymeet.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
            Send Us Your CV
          </a>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-gray-900">What we look for</h2>
          {[
            'People who genuinely love Nigerian nightlife and understand the culture',
            'Problem solvers who care about building great user experiences',
            'Self-starters who can work independently and move fast',
            'People who are honest, direct, and passionate about what they build',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 mt-2" />
              <p className="text-sm text-gray-600">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}