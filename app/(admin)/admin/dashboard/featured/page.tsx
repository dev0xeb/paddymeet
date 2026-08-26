import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, Calendar, MapPin, Eye, Sparkles,
  ShieldCheck, Ticket, Users, ExternalLink
} from 'lucide-react'
import AdminFeatureEventButton from '@/components/AdminFeatureEventButton'

export default async function AdminFeaturedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()

  if (!admin || !['super_admin', 'marketing', 'operations'].includes(admin.department)) {
    redirect('/admin/dashboard')
  }

  const [
    { data: featuredEvents },
    { data: liveEvents },
  ] = await Promise.all([
    adminClient
      .from('events')
      .select('*, organisers(id, org_name, is_verified), ticket_types(price, name)')
      .eq('is_featured', true)
      .eq('is_approved', true)
      .order('event_date', { ascending: true }),
    adminClient
      .from('events')
      .select('*, organisers(id, org_name, is_verified), ticket_types(price, name)')
      .eq('is_approved', true)
      .eq('is_live', true)
      .eq('is_featured', false)
      .order('event_date', { ascending: true })
      .limit(30),
  ])

  const gradients = [
    'from-orange-500 via-pink-600 to-purple-700',
    'from-blue-600 via-indigo-600 to-purple-800',
    'from-emerald-600 via-teal-600 to-blue-700',
    'from-amber-500 via-orange-600 to-rose-700',
  ]

  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Spotlight & Editorial
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Featured Event Spotlights</h1>
          <p className="text-xs text-slate-500">Pin top nightlife experiences, concerts, and festivals to the homepage hero carousel.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: 'Spotlight Capacity',
              value: `${featuredEvents?.length || 0} / 5 Active`,
              subtext: 'Pinned to homepage top carousel',
              icon: Star,
              color: 'amber'
            },
            {
              label: 'Eligible Live Events',
              value: `${liveEvents?.length || 0} Available`,
              subtext: 'Approved events ready to feature',
              icon: Sparkles,
              color: 'purple'
            },
            {
              label: 'Editorial Placement',
              value: 'Hero Carousel',
              subtext: 'Includes "Featured" badge in search',
              icon: Eye,
              color: 'blue'
            },
          ].map(({ label, value, subtext, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  color === 'amber' ? 'bg-amber-50 text-amber-600' :
                  color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">{value}</div>
              <div className="text-[11px] text-slate-400 font-medium">{subtext}</div>
            </div>
          ))}
        </div>

        {/* Section 1: Currently Featured (Spotlight Cards) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Currently in Homepage Spotlight ({featuredEvents?.length || 0})</h2>
            </div>
            <span className="text-xs text-slate-400">Rotates on the public hero banner</span>
          </div>

          {featuredEvents && featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredEvents.map((event, index) => {
                const org = Array.isArray(event.organisers) ? event.organisers[0] : event.organisers
                const minPrice = event.ticket_types && event.ticket_types.length > 0
                  ? Math.min(...event.ticket_types.map((t: any) => Number(t.price) || 0))
                  : null

                return (
                  <div key={event.id} className="border border-amber-200/80 bg-amber-50/40 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
                    <div>
                      {/* Image / Gradient Banner */}
                      <div
                        className={`h-32 bg-gradient-to-br ${gradients[index % gradients.length]} relative overflow-hidden`}
                        style={event.cover_image_url ? { backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                      >
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2.5 py-1 bg-amber-400 text-amber-950 text-[10px] font-extrabold rounded-full flex items-center gap-1 shadow-sm">
                            <Star className="w-3 h-3 fill-amber-950" /> SPOTLIGHT
                          </span>
                        </div>

                        <Link
                          href={`/events/${event.id}`}
                          target="_blank"
                          className="absolute top-2.5 right-2.5 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                          title="Preview Public Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Event Details */}
                      <div className="p-4">
                        <div className="text-sm font-extrabold text-slate-900 truncate mb-1">{event.title}</div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 truncate">
                          <span>Host: <strong>{org?.org_name || 'Organiser'}</strong></span>
                          {org?.is_verified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {event.city || 'Lagos'}
                          </span>
                          {minPrice !== null && (
                            <span className="font-semibold text-emerald-700 ml-auto">
                              {minPrice === 0 ? 'Free' : `From ₦${minPrice.toLocaleString()}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <AdminFeatureEventButton eventId={event.id} isFeatured={true} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No events currently in spotlight</p>
              <p className="text-xs text-slate-400 mt-0.5">Click &ldquo;Feature&rdquo; on any live event below to pin it to the homepage.</p>
            </div>
          )}
        </div>

        {/* Section 2: Eligible Live Events to Feature */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Approved Live Events — Available to Spotlight</h2>
            <span className="text-xs text-slate-400">{liveEvents?.length || 0} events</span>
          </div>

          {liveEvents && liveEvents.length > 0 ? (
            <div className="space-y-3">
              {liveEvents.map((event, index) => {
                const org = Array.isArray(event.organisers) ? event.organisers[0] : event.organisers
                const minPrice = event.ticket_types && event.ticket_types.length > 0
                  ? Math.min(...event.ticket_types.map((t: any) => Number(t.price) || 0))
                  : null

                return (
                  <div
                    key={event.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Event Thumbnail & Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                        style={event.cover_image_url ? { backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                      >
                        {!event.cover_image_url && (event.title?.charAt(0) || 'E')}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate mb-0.5">{event.title}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                          <span>Host: {org?.org_name || 'Organiser'}</span>
                          {org?.is_verified && <ShieldCheck className="w-3 h-3 text-blue-600" />}
                          <span>·</span>
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}</span>
                          <span>·</span>
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{event.city || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {minPrice !== null && (
                        <div className="text-xs font-extrabold text-emerald-700 mr-2">
                          {minPrice === 0 ? 'Free' : `From ₦${minPrice.toLocaleString()}`}
                        </div>
                      )}

                      <Link
                        href={`/events/${event.id}`}
                        target="_blank"
                        className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors shadow-xs"
                        title="View Live Event"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <AdminFeatureEventButton eventId={event.id} isFeatured={false} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-400">No unfeatured live events available at this time.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}