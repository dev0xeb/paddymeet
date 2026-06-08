import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Calendar, MapPin, Eye } from 'lucide-react'

export default async function AdminFeaturedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient.from('admin_team').select('department').eq('id', user.id).single()
  if (!admin || !['super_admin', 'marketing'].includes(admin.department)) redirect('/admin/dashboard')

  // Get featured events
  const { data: featuredEvents } = await adminClient
    .from('events')
    .select('*')
    .eq('is_featured', true)
    .eq('is_approved', true)
    .order('event_date', { ascending: true })

  // Get approved live events that are not featured
  const { data: liveEvents } = await adminClient
    .from('events')
    .select('*')
    .eq('is_approved', true)
    .eq('is_live', true)
    .eq('is_featured', false)
    .order('event_date', { ascending: true })
    .limit(20)

  const gradients = [
    'from-purple-900 via-pink-900 to-orange-900',
    'from-green-900 via-teal-900 to-blue-900',
    'from-indigo-900 via-purple-900 to-pink-900',
    'from-orange-900 via-red-900 to-pink-900',
    'from-blue-900 via-indigo-900 to-purple-900',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">Featured Events</span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">paddy<span className="text-orange-500">meet</span></Link>
      </nav>

      <div className="pt-16 max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Featured Events</h1>
          <p className="text-sm text-gray-500">Featured events appear prominently on the homepage and events listing</p>
        </div>

        {/* Currently featured */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-yellow-500" />
            <h2 className="text-sm font-extrabold text-gray-900">Currently Featured ({featuredEvents?.length || 0})</h2>
          </div>
          {featuredEvents && featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredEvents.map((event, index) => (
                <div key={event.id} className="border border-yellow-200 bg-yellow-50 rounded-2xl overflow-hidden">
                  <div className={`h-28 bg-gradient-to-br ${gradients[index % gradients.length]} relative`}
                    style={event.cover_image_url ? { backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover' } : {}}>
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-bold text-gray-900 truncate mb-1">{event.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                      <Calendar className="w-3 h-3" />
                      {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}
                      <MapPin className="w-3 h-3 ml-1" /> {event.city || '—'}
                    </div>
                    <form action={`/api/admin/events/${event.id}/unfeature`} method="POST">
                      <button type="submit" className="w-full py-2 bg-white border border-yellow-300 text-yellow-700 text-xs font-bold rounded-xl hover:bg-yellow-100 transition-colors">
                        Remove from Featured
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No featured events. Add some from the list below.</p>
            </div>
          )}
        </div>

        {/* Available to feature */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-sm font-extrabold text-gray-900 mb-4">Live Events — Add to Featured</h2>
          {liveEvents && liveEvents.length > 0 ? (
            <div className="space-y-3">
              {liveEvents.map((event, index) => (
                <div key={event.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} flex-shrink-0 flex items-center justify-center text-white font-bold`}
                    style={event.cover_image_url ? { backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover' } : {}}>
                    {!event.cover_image_url && event.title?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{event.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}
                      <MapPin className="w-3 h-3" /> {event.city || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/events/${event.id}`} target="_blank"
                      className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <form action={`/api/admin/events/${event.id}/feature`} method="POST">
                      <button type="submit" className="px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-bold rounded-xl hover:bg-yellow-100 transition-colors flex items-center gap-1">
                        <Star className="w-3 h-3" /> Feature
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No live events available to feature</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}