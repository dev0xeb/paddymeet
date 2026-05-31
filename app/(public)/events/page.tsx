import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { MapPin, Calendar, Users, Search, SlidersHorizontal, Grid3X3, List, ChevronDown } from 'lucide-react'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Build query
  let query = supabase
    .from('events')
    .select('*, ticket_types(*), organisers(org_name)')
    .eq('is_approved', true)
    .eq('is_live', true)
    .order('event_date', { ascending: true })

  // Apply filters
  if (params.city) query = query.eq('city', params.city)
  if (params.type) query = query.eq('event_type', params.type)
  if (params.vibe) query = query.eq('vibe', params.vibe)
  if (params.search) query = query.ilike('title', `%${params.search}%`)

  const { data: events } = await query.limit(24)

  const eventTypes = ['Concert', 'Club Night', 'Festival', 'Day Party', 'Lounge', 'Comedy Show', 'Arts & Culture', 'Rave']
  const vibes = ['Turnt', 'Chill', 'Exclusive', 'Wild', 'Social', 'Cultural', 'Classy']
  const cities = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan']

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
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
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

      {/* Hero bar */}
      <div className="pt-16 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6">

          {/* Title and search */}
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Browse Events</h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full w-72 focus-within:border-orange-400 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <form>
                <input
                  name="search"
                  defaultValue={params.search || ''}
                  placeholder="Search events, venues..."
                  className="bg-transparent border-none outline-none text-sm text-gray-900 w-full placeholder:text-gray-400"
                />
              </form>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-wrap">

            {/* Location */}
            <div className="relative group flex-shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 cursor-pointer hover:border-gray-300 transition-all">
                <MapPin className="w-3.5 h-3.5" />
                {params.city || 'Lagos'}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl p-2 shadow-xl z-50 min-w-[180px] hidden group-hover:block">
                {cities.map(city => (
                  <Link key={city} href={`/events?city=${city.toLowerCase()}${params.type ? `&type=${params.type}` : ''}${params.vibe ? `&vibe=${params.vibe}` : ''}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${params.city === city.toLowerCase() ? 'bg-orange-50 text-orange-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <MapPin className="w-3.5 h-3.5" />
                    {city}
                    {city === 'Lagos' && !params.city && <span className="ml-auto text-xs text-orange-500 font-bold">Current</span>}
                  </Link>
                ))}
              </div>
            </div>

            <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

            {/* Date filter */}
            <div className="relative group flex-shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-semibold cursor-pointer transition-all ${params.date ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                <Calendar className="w-3.5 h-3.5" />
                {params.date || 'Date'}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </div>
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl p-3 shadow-xl z-50 min-w-[200px] hidden group-hover:block">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick select</div>
                {['This Weekend', 'This Week', 'This Month', 'Next Month'].map(d => (
                  <Link key={d} href={`/events?date=${d.toLowerCase().replace(' ', '-')}${params.city ? `&city=${params.city}` : ''}${params.type ? `&type=${params.type}` : ''}`}
                    className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${params.date === d.toLowerCase().replace(' ', '-') ? 'bg-orange-50 text-orange-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {d}
                  </Link>
                ))}
              </div>
            </div>

            <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

            {/* Event type */}
            <div className="relative group flex-shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-semibold cursor-pointer transition-all ${params.type ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {params.type || 'Type'}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </div>
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl p-3 shadow-xl z-50 min-w-[200px] hidden group-hover:block">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event type</div>
                <div className="flex flex-wrap gap-1.5">
                  {eventTypes.map(type => (
                    <Link key={type} href={`/events?type=${type.toLowerCase().replace(' ', '-')}${params.city ? `&city=${params.city}` : ''}${params.vibe ? `&vibe=${params.vibe}` : ''}`}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${params.type === type.toLowerCase().replace(' ', '-') ? 'bg-orange-50 border-orange-300 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {type}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

            {/* Vibe */}
            <div className="relative group flex-shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-semibold cursor-pointer transition-all ${params.vibe ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                {params.vibe || 'Vibe'}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </div>
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl p-3 shadow-xl z-50 min-w-[200px] hidden group-hover:block">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event vibe</div>
                <div className="flex flex-wrap gap-1.5">
                  {vibes.map(vibe => (
                    <Link key={vibe} href={`/events?vibe=${vibe.toLowerCase()}${params.city ? `&city=${params.city}` : ''}${params.type ? `&type=${params.type}` : ''}`}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${params.vibe === vibe.toLowerCase() ? 'bg-orange-50 border-orange-300 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {vibe}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

            {/* Capacity */}
            <div className="relative group flex-shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-semibold cursor-pointer transition-all ${params.capacity ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                <Users className="w-3.5 h-3.5" />
                {params.capacity || 'Capacity'}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </div>
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl p-3 shadow-xl z-50 min-w-[180px] hidden group-hover:block">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Venue size</div>
                {['Intimate', 'Medium', 'Large Venue', 'Full House'].map(c => (
                  <Link key={c} href={`/events?capacity=${c.toLowerCase().replace(' ', '-')}${params.city ? `&city=${params.city}` : ''}${params.type ? `&type=${params.type}` : ''}`}
                    className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${params.capacity === c.toLowerCase().replace(' ', '-') ? 'bg-orange-50 text-orange-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {c}
                  </Link>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {(params.city || params.type || params.vibe || params.date || params.capacity || params.search) && (
              <Link href="/events" className="px-4 py-2 text-sm font-bold text-orange-500 hover:underline flex-shrink-0">
                Clear all
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">

        {/* Results header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="text-sm font-semibold text-gray-500">
            <span className="text-gray-900 font-bold">{events?.length || 0}</span> events found
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500 font-medium">Sort by</span>
              <select className="text-sm font-semibold text-gray-700 border border-gray-200 rounded-full px-3 py-1.5 bg-white outline-none appearance-none cursor-pointer">
                <option>Most relevant</option>
                <option>Date — soonest first</option>
                <option>Most popular</option>
                <option>Groups available</option>
              </select>
            </div>
            <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1">
              <button className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700">
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Events grid */}
        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event, index) => (
              <Link key={event.id} href={`/events/${event.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-50 transition-all duration-300">
                <div className={`h-44 bg-gradient-to-br ${gradients[index % gradients.length]} relative`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700">
                      {event.vibe || 'Social'}
                    </span>
                    {event.is_free ? (
                      <span className="px-2.5 py-1 bg-green-500 rounded-full text-xs font-bold text-white">Free</span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-500 rounded-full text-xs font-bold text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Groups open
                      </span>
                    )}
                  </div>
                  {event.age_restriction > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                        {event.age_restriction}+
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">
                    {event.event_type} · {event.city}
                  </div>
                  <div className="text-base font-extrabold text-gray-900 mb-2 tracking-tight leading-snug group-hover:text-orange-500 transition-colors">
                    {event.title}
                  </div>
                  <div className="text-xs text-gray-500 mb-4 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBC'}
                    </span>
                    {event.start_time && (
                      <span>{event.start_time.slice(0, 5)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {['bg-orange-400','bg-pink-500','bg-purple-500'].map((c,i) => (
                          <div key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-white -ml-1.5 first:ml-0`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">Going</span>
                    </div>
                    {event.is_free ? (
                      <span className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 text-xs font-bold rounded-full">
                        Free
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-full group-hover:bg-orange-600 transition-colors">
                        Get Tickets
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No events found</h3>
            <p className="text-sm text-gray-400 mb-6">
              {params.search || params.type || params.vibe
                ? 'Try adjusting your filters or search terms'
                : 'No events are available right now. Check back soon.'}
            </p>
            {(params.search || params.type || params.vibe || params.city) && (
              <Link href="/events" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
                Clear all filters
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {events && events.length >= 24 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors text-lg">
              ‹
            </button>
            {[1,2,3].map(n => (
              <button key={n} className={`w-10 h-10 rounded-xl border text-sm font-bold transition-colors ${n === 1 ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                {n}
              </button>
            ))}
            <span className="text-gray-400 px-1">...</span>
            <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:border-gray-300 transition-colors">
              8
            </button>
            <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors text-lg">
              ›
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 px-10 mt-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Link href="/" className="text-lg font-bold text-gray-900">
            paddy<span className="text-orange-500">meet</span>
          </Link>
          <div className="flex gap-6">
            {['About','How It Works','For Organisers','Contact'].map(l => (
              <Link key={l} href="/signup" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{l}</Link>
            ))}
          </div>
          <div className="text-xs text-gray-400">© 2025 Paddymeet</div>
        </div>
      </footer>

    </div>
  )
}