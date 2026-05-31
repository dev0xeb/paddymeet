import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, Clock, Users, ArrowLeft, Share2 } from 'lucide-react'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch event
  const { data: event } = await supabase
    .from('events')
    .select('*, ticket_types(*), organisers(org_name, contact_name)')
    .eq('id', id)
    .eq('is_approved', true)
    .single()

  if (!event) notFound()

  const gradients = [
    'from-purple-900 via-pink-900 to-orange-900',
    'from-green-900 via-teal-900 to-blue-900',
    'from-indigo-900 via-purple-900 to-pink-900',
    'from-orange-900 via-red-900 to-pink-900',
    'from-blue-900 via-indigo-900 to-purple-900',
  ]
  const gradient = gradients[id.charCodeAt(0) % gradients.length]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-10 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
              My Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Log In</Link>
              <Link href="/signup" className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className={`h-72 md:h-96 bg-gradient-to-br ${gradient} relative mt-16`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-6">
          <Link href="/events" className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-sm font-semibold text-white hover:bg-white/30 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to events
          </Link>
        </div>

        {/* Share button */}
        <div className="absolute top-6 right-6">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-sm font-semibold text-white hover:bg-white/30 transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Event tags */}
        <div className="absolute bottom-24 left-6 flex items-center gap-2 flex-wrap">
          {event.event_type && (
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white uppercase tracking-wider">
              {event.event_type}
            </span>
          )}
          {event.vibe && (
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white">
              {event.vibe}
            </span>
          )}
          {event.age_restriction > 0 && (
            <span className="px-3 py-1 bg-orange-500/80 rounded-full text-xs font-bold text-white">
              {event.age_restriction}+
            </span>
          )}
        </div>

        {/* Title */}
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — main info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Key details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</div>
                    <div className="text-sm font-bold text-gray-900">
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                        : 'TBC'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Time</div>
                    <div className="text-sm font-bold text-gray-900">
                      {event.start_time ? event.start_time.slice(0, 5) : 'TBC'}
                      {event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Venue</div>
                    <div className="text-sm font-bold text-gray-900">{event.venue_name || 'TBC'}</div>
                    {event.venue_address && (
                      <div className="text-xs text-gray-500 mt-0.5">{event.venue_address}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Users className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Organiser</div>
                    <div className="text-sm font-bold text-gray-900">
                      {event.organisers?.org_name || 'Paddymeet'}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-base font-extrabold text-gray-900 mb-3">About This Event</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Dress code */}
            {event.dress_code && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-base font-extrabold text-gray-900 mb-3">Dress Code</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{event.dress_code}</p>
              </div>
            )}

          </div>

          {/* Right — sticky sidebar */}
          <div className="space-y-4">

            {/* Quick info card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <div className="text-center pb-4 border-b border-gray-100 mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {event.is_free ? 'Free Event' : 'Tickets Available'}
                </div>
                {event.is_free ? (
                  <div className="text-2xl font-extrabold text-green-500">Free</div>
                ) : (
                  <div className="text-xs text-gray-500">See ticket options below</div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {event.cancellation_policy && (
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{event.cancellation_policy}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Valid ID required at entry</span>
                </div>
                {event.age_restriction > 0 && (
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{event.age_restriction}+ only. Age strictly enforced.</span>
                  </div>
                )}
              </div>

              {user ? (
                <button className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
                  {event.is_free ? 'Get Free Ticket' : 'Get Tickets'}
                </button>
              ) : (
                <div className="space-y-2">
                  <Link href="/signup" className="w-full flex items-center justify-center py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
                    Sign up to get tickets
                  </Link>
                  <Link href="/login" className="w-full flex items-center justify-center py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:border-gray-300 transition-colors">
                    Already have an account? Log in
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}