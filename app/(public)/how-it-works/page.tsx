import Link from 'next/link'
import { ArrowLeft, Search, Users, Ticket, Star, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how Paddymeet helps you discover events, join groups and experience Nigeria\'s nightlife.',
}

export default function HowItWorksPage() {
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
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 py-20 px-4 md:px-10 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs font-bold text-orange-400 uppercase tracking-wider mb-6">
              How It Works
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              From solo to squad in<br /><span className="text-orange-500">four easy steps</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Paddymeet makes it easy to discover events, find your crew and experience Nigeria&apos;s nightlife safely and anonymously.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto px-4 md:px-10 py-20">
          <div className="space-y-16">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Discover Events Near You',
                desc: 'Browse events across Nigeria filtered by city, vibe, date and what you are into. From club nights in Lagos to cultural festivals in Abuja — Paddymeet has something for everyone. Every event is reviewed by our team before going live so you only see quality listings.',
                color: 'orange',
              },
              {
                step: '02',
                icon: Users,
                title: 'Join or Create a Group',
                desc: 'Every event has a main group chat open to all attendees. You can also join or create smaller social groups based on your vibe — whether you want a chill crew, an exclusive table, or a mixed group of new people. Your face stays private. Only your username and avatar are visible.',
                color: 'blue',
              },
              {
                step: '03',
                icon: Ticket,
                title: 'Get Your Tickets',
                desc: 'Buy solo tickets or split a group ticket with your new crew through Paddymeet. Payment is secure and handled by our verified payment partners. Your ticket is delivered instantly to your dashboard with a unique QR code for entry.',
                color: 'green',
              },
              {
                step: '04',
                icon: Star,
                title: 'Build Your Reputation',
                desc: 'Every event you attend builds your trust score and moves you up through the tiers — from Newbie to Legendary. Higher trust unlocks access to exclusive events, better groups, and special perks. Your reputation on Paddymeet follows you across every event.',
                color: 'purple',
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    color === 'orange' ? 'bg-orange-50' :
                    color === 'blue' ? 'bg-blue-50' :
                    color === 'green' ? 'bg-green-50' : 'bg-purple-50'
                  }`}>
                    <Icon className={`w-7 h-7 ${
                      color === 'orange' ? 'text-orange-500' :
                      color === 'blue' ? 'text-blue-500' :
                      color === 'green' ? 'text-green-500' : 'text-purple-500'
                    }`} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-5xl font-extrabold text-gray-100 leading-none mb-2">{step}</div>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-3">{title}</h2>
                  <p className="text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Ready to find your crew?</h2>
            <p className="text-gray-500 mb-8">Join thousands of people already using Paddymeet across Nigeria.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all hover:shadow-xl hover:shadow-orange-200">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}