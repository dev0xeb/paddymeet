import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Paddymeet and our mission to connect nightlife lovers across Nigeria.',
}

export default function AboutPage() {
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

      <div className="pt-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-24 px-4 md:px-10 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
              We built Paddymeet because<br /><span className="text-orange-500">going out alone is overrated</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Paddymeet is a nightlife event discovery and group coordination platform built for Nigeria. We help people find great events and connect with like-minded people safely and anonymously.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-10 py-20 space-y-16">

          {/* Mission */}
          <section>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              Nigeria has one of the most vibrant nightlife cultures in the world. But going out — especially alone or in a new city — can feel intimidating. Finding good events is hard. Meeting people you vibe with is even harder. And safety is always a concern.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg mt-4">
              Paddymeet was built to solve all of that. We want everyone to be able to walk into any event feeling confident, connected, and safe — with a crew that matches their energy.
            </p>
          </section>

          {/* Story */}
          <section>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed">
              Paddymeet started with a simple observation — great events happen every weekend across Nigeria, but most people either miss them or go alone. Social media helps you discover events, but it doesn&apos;t help you actually coordinate with people or feel safe meeting strangers.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              We built Paddymeet to bridge that gap. A platform where you can discover events, find people going to the same events, form groups, split tickets, and build a social reputation based on your nightlife experiences.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              We launched in Lagos and are now expanding to cover nightlife events across the entire country.
            </p>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">What We Stand For</h2>
            <div className="space-y-4">
              {[
                { title: 'Privacy First', desc: 'Your face and real identity stay private. We believe you should control how much of yourself you share.' },
                { title: 'Safety Always', desc: 'Every user is verified and every event is screened. We take safety seriously so you can focus on having fun.' },
                { title: 'Community Over Clout', desc: 'We are not a social media platform. We are a community tool. We care about real connections, not follower counts.' },
                { title: 'Built for Nigeria', desc: 'We understand Nigerian nightlife culture from the inside. We build for the realities of going out in Nigeria — not a Western template.' },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-4 p-5 bg-gray-50 rounded-2xl">
                  <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-2" />
                  <div>
                    <p className="font-extrabold text-gray-900 mb-1">{title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="text-center py-10 border-t border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Join the movement</h2>
            <p className="text-gray-500 mb-8">Thousands of people across Nigeria are already finding their crew on Paddymeet.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all hover:shadow-xl hover:shadow-orange-200">
              Create Your Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}