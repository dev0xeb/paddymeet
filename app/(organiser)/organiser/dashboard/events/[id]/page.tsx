import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, MapPin, Clock, Ticket,
  Users, CheckCircle, XCircle, Edit, Eye
} from 'lucide-react'

export default async function OrganiserManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id, org_name')
    .eq('id', user.id)
    .single()
  if (!organiser) redirect('/login')

  // Fetch event — must belong to this organiser
  const { data: event } = await supabase
    .from('events')
    .select('*, ticket_types(*)')
    .eq('id', id)
    .eq('organiser_id', user.id)
    .single()

  if (!event) notFound()

  // Fetch orders for this event
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch attendees
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, users(username, city), ticket_types(name, price)')
    .eq('event_id', id)
    .order('purchased_at', { ascending: false })
    .limit(10)

  const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0
  const totalTickets = tickets?.length || 0
  const attended = tickets?.filter(t => t.attended).length || 0

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
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/organiser/dashboard/events" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> My Events
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Manage Event
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        {event.is_approved && event.is_live && (
          <Link href={`/events/${event.id}`} target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-600 text-sm font-bold rounded-xl hover:bg-green-100 transition-colors">
            <Eye className="w-4 h-4" /> View Live
          </Link>
        )}
        {!event.is_approved && (
          <Link href={`/organiser/dashboard/events/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 text-sm font-bold rounded-xl hover:bg-blue-100 transition-colors">
            <Edit className="w-4 h-4" /> Edit Event
          </Link>
        )}
        {event.is_approved && event.is_live && (
          <Link href={`/organiser/dashboard/events/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors ml-2">
            <Edit className="w-4 h-4" /> Edit
          </Link>
        )}
      </nav>

      <div className="pt-16 max-w-5xl mx-auto px-6 py-8">

        {/* Event hero */}
        <div className={`h-40 rounded-2xl bg-gradient-to-br ${gradient} relative mb-6 overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              event.is_approved && event.is_live
                ? 'bg-green-50 text-green-600 border-green-200'
                : !event.is_approved
                ? 'bg-orange-50 text-orange-500 border-orange-200'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
              {event.is_approved && event.is_live ? 'Live' : !event.is_approved ? 'Pending Review' : 'Approved'}
            </span>
            {event.is_free && (
              <span className="px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 rounded-full text-xs font-bold">Free</span>
            )}
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            <h1 className="text-xl font-extrabold text-white tracking-tight">{event.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.start_time ? event.start_time.slice(0, 5) : 'TBC'}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue_name}{event.city ? `, ${event.city}` : ''}</span>
            </div>
          </div>
        </div>

        {/* Pending notice */}
        {!event.is_approved && (
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl mb-6">
            <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-orange-700">Awaiting Paddymeet review</div>
              <div className="text-xs text-orange-600">Your event is being reviewed. You will be notified once approved. Usually within 24-48 hours.</div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tickets sold', value: totalTickets, icon: Ticket, color: 'blue' },
            { label: 'Gross revenue', value: `₦${(totalRevenue / 1000).toFixed(1)}k`, icon: CheckCircle, color: 'green' },
            { label: 'Attended', value: attended, icon: Users, color: 'orange' },
            { label: 'Ticket types', value: event.ticket_types?.length || 0, icon: Edit, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                color === 'blue' ? 'bg-blue-50' :
                color === 'green' ? 'bg-green-50' :
                color === 'orange' ? 'bg-orange-50' : 'bg-purple-50'
              }`}>
                <Icon className={`w-4 h-4 ${
                  color === 'blue' ? 'text-blue-500' :
                  color === 'green' ? 'text-green-500' :
                  color === 'orange' ? 'text-orange-500' : 'text-purple-500'
                }`} />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 tracking-tight mb-0.5">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Left — event details */}
          <div className="col-span-2 space-y-5">

            {/* Event info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold text-gray-900">Event Details</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Event type', value: event.event_type || '—' },
                  { label: 'Vibe', value: event.vibe || '—' },
                  { label: 'Date', value: event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'TBC' },
                  { label: 'Time', value: event.start_time ? `${event.start_time.slice(0, 5)}${event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''}` : 'TBC' },
                  { label: 'Venue', value: event.venue_name || 'TBC' },
                  { label: 'Address', value: event.venue_address || '—' },
                  { label: 'City', value: `${event.city || '—'}${event.state ? `, ${event.state}` : ''}` },
                  { label: 'Age restriction', value: event.age_restriction > 0 ? `${event.age_restriction}+` : 'All ages' },
                  { label: 'Capacity', value: event.capacity ? event.capacity.toLocaleString() : '—' },
                  { label: 'Dress code', value: event.dress_code || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-bold text-gray-400 w-28 flex-shrink-0 uppercase tracking-wider pt-0.5">{label}</span>
                    <span className="text-sm text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ticket types */}
            {event.ticket_types && event.ticket_types.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-sm font-extrabold text-gray-900 mb-4">Ticket Types</h2>
                <div className="space-y-3">
                  {event.ticket_types.map((t: { id: string, name: string, price: number, quantity: number, quantity_sold: number, description: string }) => (
                    <div key={t.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900">{t.name}</div>
                        {t.description && <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>}
                      </div>
                      <div className="text-sm font-bold text-gray-900 flex-shrink-0">₦{t.price.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 flex-shrink-0">
                        {t.quantity_sold || 0}/{t.quantity} sold
                      </div>
                      <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, ((t.quantity_sold || 0) / t.quantity) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent attendees */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold text-gray-900">Recent Attendees</h2>
                <Link href="/organiser/dashboard/attendees" className="text-xs font-bold text-blue-500 hover:underline">View all →</Link>
              </div>
              {tickets && tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.map((ticket) => {
                    const u = Array.isArray(ticket.users) ? ticket.users[0] : ticket.users
                    const tt = Array.isArray(ticket.ticket_types) ? ticket.ticket_types[0] : ticket.ticket_types
                    return (
                      <div key={ticket.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900">{u?.username || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{tt?.name} · {u?.city || '—'}</div>
                        </div>
                        {ticket.attended ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                            <CheckCircle className="w-3 h-3" /> Attended
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-orange-500">
                            <XCircle className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No attendees yet</p>
                </div>
              )}
            </div>

          </div>

          {/* Right */}
          <div className="space-y-5">

            {/* Description */}
            {event.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Description</h2>
                <p className="text-xs text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Cancellation policy */}
            {event.cancellation_policy && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cancellation Policy</h2>
                <p className="text-xs text-gray-600 leading-relaxed">{event.cancellation_policy}</p>
              </div>
            )}

            {/* House rules */}
            {event.house_rules && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">House Rules</h2>
                <p className="text-xs text-gray-600 leading-relaxed">{event.house_rules}</p>
              </div>
            )}

            {/* Links */}
            {(event.website || event.social_link) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Links</h2>
                <div className="space-y-2">
                  {event.website && (
                    <a href={event.website} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-500 hover:underline truncate">{event.website}</a>
                  )}
                  {event.social_link && (
                    <a href={event.social_link} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-500 hover:underline truncate">{event.social_link}</a>
                  )}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Links</h2>
              <div className="space-y-2">
                {[
                  { label: 'View all ticket sales', href: '/organiser/dashboard/tickets' },
                  { label: 'View all attendees', href: '/organiser/dashboard/attendees' },
                  { label: 'Revenue breakdown', href: '/organiser/dashboard/revenue' },
                ].map(({ label, href }) => (
                  <Link key={label} href={href} className="block text-xs text-blue-500 hover:underline">{label} →</Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}