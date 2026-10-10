import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import EventsFilterBar from '@/components/events/EventsFilterBar'
import EventsResults from '@/components/events/EventsResults'
import { Suspense } from 'react'
import UserAvatarMenu from '@/components/UserAvatarMenu'
import Logo from '@/components/brand/Logo'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user ? await supabase
    .from('users')
    .select('username, tier')
    .eq('id', user.id)
    .single() : { data: null }

  // Once an event's date has passed it has nothing left to sell and
  // shouldn't keep showing here — same fix as the landing page and
  // dashboard's upcoming-events lists.
  const today = new Date().toISOString().split('T')[0]
  let query = supabase
    .from('events')
    .select('*, ticket_types(*), organisers(org_name)')
    .eq('is_approved', true)
    .eq('is_live', true)
    .gte('event_date', today)
    .order('event_date', { ascending: true })

  if (params.city) query = query.ilike('city', `%${params.city}%`)
  if (params.type) query = query.eq('event_type', params.type)
  if (params.vibe) query = query.eq('vibe', params.vibe)
  if (params.search) query = query.ilike('title', `%${params.search}%`)
  if (params.date) {
    const nextDay = new Date(new Date(params.date).getTime() + 86400000).toISOString().split('T')[0]
    query = query.gte('event_date', params.date).lt('event_date', nextDay)
  }

  const { data: events } = await query.limit(24)

  const gradients = [
    'from-purple-900 via-pink-900 to-orange-900',
    'from-green-900 via-teal-900 to-blue-900',
    'from-indigo-900 via-purple-900 to-pink-900',
    'from-orange-900 via-red-900 to-pink-900',
    'from-blue-900 via-indigo-900 to-purple-900',
    'from-green-900 via-emerald-900 to-teal-900',
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-10 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          <Logo variant="horizontal" tone="color" className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          {user && profile ? (
            <UserAvatarMenu username={profile.username} tier={profile.tier || 'Newbie'} />
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Log In</Link>
              <Link href="/signup" className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Filter bar — client component */}
      <div className="pt-16">
        <Suspense fallback={<div className="h-32 bg-white border-b border-gray-100" />}>
          <EventsFilterBar currentParams={params} />
        </Suspense>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">

        <EventsResults
          events={events || []}
          gradients={gradients}
          hasActiveFilters={!!(params.search || params.type || params.vibe || params.city)}
        />

        {/* Pagination */}
        {events && events.length >= 24 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors text-lg">‹</button>
            {[1,2,3].map(n => (
              <button key={n} className={`w-10 h-10 rounded-xl border text-sm font-bold transition-colors ${n === 1 ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>{n}</button>
            ))}
            <span className="text-gray-400 px-1">...</span>
            <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:border-gray-300 transition-colors">8</button>
            <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors text-lg">›</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 px-10 mt-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Link href="/" className="text-lg font-bold text-gray-900"><Logo variant="horizontal" tone="color" className="h-6 w-auto" /></Link>
          <div className="flex gap-6">
            {['About','How It Works','For Organisers','Contact'].map(l => (
              <Link key={l} href="/signup" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{l}</Link>
            ))}
          </div>
          <div className="text-xs text-gray-400">© {new Date().getFullYear()} Paddymeet</div>
        </div>
      </footer>

    </div>
  )
}