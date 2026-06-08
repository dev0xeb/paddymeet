import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, XCircle, Eye, Calendar,
  MapPin, Users, Clock, Filter
} from 'lucide-react'

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()

  if (!admin) redirect('/admin-login')

  const params = await searchParams
  const status = params.status || 'pending'

  let query = adminClient
    .from('events')
    .select('*, organisers(org_name, contact_name, email), ticket_types(*)')
    .order('created_at', { ascending: false })

  if (status === 'pending') query = query.eq('is_approved', false).eq('is_rejected', false)
  if (status === 'live') query = query.eq('is_approved', true).eq('is_live', true)
  if (status === 'rejected') query = query.eq('is_rejected', true)
  // 'all' — no filter

  const { data: events } = await query.limit(50)

  const [
    { count: pendingCount },
    { count: liveCount },
    { count: rejectedCount },
    { count: totalCount },
  ] = await Promise.all([
    adminClient.from('events').select('*', { count: 'exact', head: true }).eq('is_approved', false).eq('is_rejected', false),
    adminClient.from('events').select('*', { count: 'exact', head: true }).eq('is_approved', true).eq('is_live', true),
    adminClient.from('events').select('*', { count: 'exact', head: true }).eq('is_rejected', true),
    adminClient.from('events').select('*', { count: 'exact', head: true }),
  ])

  const gradients = [
    'from-purple-900 via-pink-900 to-orange-900',
    'from-green-900 via-teal-900 to-blue-900',
    'from-indigo-900 via-purple-900 to-pink-900',
    'from-orange-900 via-red-900 to-pink-900',
    'from-blue-900 via-indigo-900 to-purple-900',
  ]

  const getStatusBadge = (event: { is_approved: boolean, is_live: boolean, is_rejected: boolean }) => {
    if (event.is_rejected) return { label: 'Rejected', class: 'bg-red-50 text-red-500 border-red-200' }
    if (event.is_approved && event.is_live) return { label: 'Live', class: 'bg-green-50 text-green-600 border-green-200' }
    if (event.is_approved && !event.is_live) return { label: 'Approved', class: 'bg-blue-50 text-blue-600 border-blue-200' }
    return { label: 'Pending', class: 'bg-orange-50 text-orange-500 border-orange-200' }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Events Management
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-6xl mx-auto px-6 py-8">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Events</h1>
            <p className="text-sm text-gray-500">Review, approve or reject events submitted by organisers</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending review', value: pendingCount ?? 0, color: 'orange', status: 'pending' },
            { label: 'Live events', value: liveCount ?? 0, color: 'green', status: 'live' },
            { label: 'Rejected', value: rejectedCount ?? 0, color: 'red', status: 'rejected' },
            { label: 'Total events', value: totalCount ?? 0, color: 'blue', status: 'all' },
          ].map(({ label, value, color, status: s }) => (
            <Link key={label} href={`/admin/dashboard/events?status=${s}`}
              className={`bg-white border-2 rounded-2xl p-5 transition-all hover:shadow-sm ${
                status === s
                  ? color === 'orange' ? 'border-orange-300' :
                    color === 'green' ? 'border-green-300' :
                    color === 'red' ? 'border-red-300' : 'border-blue-300'
                  : 'border-gray-100'
              }`}>
              <div className="text-2xl font-extrabold text-gray-900 mb-0.5">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </Link>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {[
            { label: 'Pending', value: 'pending', count: pendingCount ?? 0 },
            { label: 'Live', value: 'live', count: liveCount ?? 0 },
            { label: 'Rejected', value: 'rejected', count: rejectedCount ?? 0 },
            { label: 'All Events', value: 'all', count: totalCount ?? 0 },
          ].map(({ label, value, count }) => (
            <Link key={value} href={`/admin/dashboard/events?status=${value}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                status === value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                status === value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{count}</span>
            </Link>
          ))}
        </div>

        {/* Events list */}
        {events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event, index) => {
              const badge = getStatusBadge(event)
              return (
                <div key={event.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-5 p-5">

                    <div
                      className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-extrabold text-2xl"
                      style={event.cover_image_url
                        ? { backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : undefined}>
                      {!event.cover_image_url && (
                        <div className={`w-full h-full rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center text-white font-extrabold text-2xl`}>
                          {event.title?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base font-extrabold text-gray-900">{event.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badge.class}`}>
                              {badge.label}
                            </span>
                            {event.is_free && (
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 text-xs font-bold rounded-full">Free</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-semibold">
                            by {event.organisers?.org_name}
                          </div>
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
                        {event.age_restriction > 0 && (
                          <span className="text-xs font-bold text-orange-500">{event.age_restriction}+</span>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{event.description}</p>
                      )}

                      {event.ticket_types && event.ticket_types.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <Users className="w-3 h-3 text-gray-400" />
                          {event.ticket_types.map((t: { id: string, name: string, price: number, quantity: number }) => (
                            <span key={t.id} className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                              {t.name} — ₦{t.price.toLocaleString()} ({t.quantity} available)
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-gray-400">
                        Organiser: {event.organisers?.contact_name} · {event.organisers?.email}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Link href={`/events/${event.id}`} target="_blank"
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:border-gray-300 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </Link>

                      {/* Only show approve/reject for pending events */}
                      {!event.is_approved && !event.is_rejected && (
                        <>
                          <form action={`/api/admin/events/${event.id}/approve`} method="POST">
                            <button type="submit"
                              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          </form>
                          <form action={`/api/admin/events/${event.id}/reject`} method="POST">
                            <button type="submit"
                              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </form>
                        </>
                      )}

                      {/* Take down live event */}
                      {event.is_approved && event.is_live && (
                        <form action={`/api/admin/events/${event.id}/reject`} method="POST">
                          <button type="submit"
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Take Down
                          </button>
                        </form>
                      )}

                      {/* Rejected — no actions */}
                      {event.is_rejected && (
                        <span className="px-4 py-2 bg-red-50 border border-red-200 text-red-400 text-xs font-bold rounded-xl text-center">
                          Rejected
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-700 mb-1">
              {status === 'pending' ? 'No events pending review' :
               status === 'rejected' ? 'No rejected events' : 'No events found'}
            </h3>
            <p className="text-sm text-gray-400">
              {status === 'pending' ? 'All submitted events have been reviewed.' : 'Events will appear here once organisers start submitting.'}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}