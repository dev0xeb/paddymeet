import SupportChat from '@/components/SupportChat'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Calendar, MapPin, Clock,
  CheckCircle, XCircle, Eye, MoreHorizontal, Ticket
} from 'lucide-react'

export default async function OrganiserEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id, org_name, is_verified')
    .eq('id', user.id)
    .single()

  if (!organiser) redirect('/login')

  const params = await searchParams
  const filter = params.filter || 'all'

  let query = supabase
    .from('events')
    .select('*, ticket_types(*)')
    .eq('organiser_id', user.id)
    .order('created_at', { ascending: false })

  if (filter === 'live') query = query.eq('is_approved', true).eq('is_live', true)
  if (filter === 'pending') query = query.eq('is_approved', false)
  if (filter === 'ended') query = query.eq('is_live', false).eq('is_approved', true)

  const { data: events } = await query

  const { count: liveCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organiser_id', user.id)
    .eq('is_approved', true)
    .eq('is_live', true)

  const { count: pendingCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organiser_id', user.id)
    .eq('is_approved', false)

  const { count: totalCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organiser_id', user.id)

  const getStatus = (event: { is_approved: boolean, is_live: boolean }) => {
    if (!event.is_approved) return { label: 'Pending', color: 'bg-orange-50 text-orange-500 border-orange-200', icon: Clock }
    if (event.is_live) return { label: 'Live', color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle }
    return { label: 'Ended', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: XCircle }
  }

  const gradients = [
    'from-purple-900 via-pink-900 to-orange-900',
    'from-green-900 via-teal-900 to-blue-900',
    'from-indigo-900 via-purple-900 to-pink-900',
    'from-orange-900 via-red-900 to-pink-900',
    'from-blue-900 via-indigo-900 to-purple-900',
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/organiser/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            My Events
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <Link href="/organiser/dashboard/events/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors">
          <Plus className="w-4 h-4" /> New Event
        </Link>
      </nav>

      <div className="pt-16 max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">My Events</h1>
            <p className="text-sm text-gray-500">{totalCount || 0} events submitted</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Live events', value: liveCount ?? 0, color: 'green', filter: 'live' },
            { label: 'Pending review', value: pendingCount ?? 0, color: 'orange', filter: 'pending' },
            { label: 'Total events', value: totalCount ?? 0, color: 'blue', filter: 'all' },
          ].map(({ label, value, color, filter: f }) => (
            <Link key={label} href={`/organiser/dashboard/events?filter=${f}`}
              className={`bg-white border-2 rounded-2xl p-5 transition-all hover:shadow-sm ${
                filter === f
                  ? color === 'green' ? 'border-green-300' :
                    color === 'orange' ? 'border-orange-300' : 'border-blue-300'
                  : 'border-gray-100'
              }`}>
              <div className="text-2xl font-extrabold text-gray-900 mb-0.5">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </Link>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { label: 'All', value: 'all', count: totalCount ?? 0 },
            { label: 'Live', value: 'live', count: liveCount ?? 0 },
            { label: 'Pending', value: 'pending', count: pendingCount ?? 0 },
          ].map(({ label, value, count }) => (
            <Link key={value} href={`/organiser/dashboard/events?filter=${value}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                filter === value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{count}</span>
            </Link>
          ))}
        </div>

        {/* Events list */}
        {events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event, index) => {
              const status = getStatus(event)
              const StatusIcon = status.icon

              return (
                <div key={event.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-5 p-5">

                    {/* Thumbnail */}
                    <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} flex-shrink-0 flex items-center justify-center text-white font-extrabold text-2xl`}>
                      {event.title?.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base font-extrabold text-gray-900">{event.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${status.color}`}>
                              <span className="flex items-center gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </span>
                            </span>
                            {event.is_free && (
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 text-xs font-bold rounded-full">Free</span>
                            )}
                          </div>
                          <div className="text-xs text-blue-500 font-semibold">{event.event_type} · {event.vibe}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap mb-3">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {event.start_time ? event.start_time.slice(0, 5) : 'TBC'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {event.venue_name}{event.city ? `, ${event.city}` : ''}
                        </span>
                      </div>

                      {/* Ticket info */}
                      {event.ticket_types && event.ticket_types.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Ticket className="w-3 h-3 text-gray-400" />
                          {event.ticket_types.map((t: { id: string, name: string, price: number, quantity: number, quantity_sold: number }) => (
                            <span key={t.id} className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                              {t.name} — ₦{t.price.toLocaleString()} ({t.quantity_sold || 0}/{t.quantity} sold)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {event.is_approved && event.is_live && (
                        <Link href={`/events/${event.id}`} target="_blank"
                          className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:border-gray-300 transition-colors">
                          <Eye className="w-3.5 h-3.5" /> View Live
                        </Link>
                      )}
                      <Link href={`/organiser/dashboard/events/${event.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors">
                        <MoreHorizontal className="w-3.5 h-3.5" /> Manage
                      </Link>
                    </div>

                  </div>

                  {/* Pending notice */}
                  {!event.is_approved && (
                    <div className="px-5 py-3 bg-orange-50 border-t border-orange-100 text-xs text-orange-600 font-medium flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting Paddymeet review — usually within 24 to 48 hours
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Calendar className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-2">
              {filter === 'pending' ? 'No events pending review' :
               filter === 'live' ? 'No live events yet' :
               'No events submitted yet'}
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              {filter === 'all' ? 'Submit your first event to get started' : 'Try a different filter'}
            </p>
            {filter === 'all' && (
              <Link href="/organiser/dashboard/events/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors">
                <Plus className="w-4 h-4" /> Submit New Event
              </Link>
            )}
          </div>
        )}

      </div>
      <SupportChat accountType="organiser" />
    </div>
  )
}