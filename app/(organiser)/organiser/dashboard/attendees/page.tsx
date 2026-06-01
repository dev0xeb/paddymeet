import SupportChat from '@/components/SupportChat'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Users, Calendar, Ticket,
  CheckCircle, Clock, ChevronLeft, ChevronRight, Download
} from 'lucide-react'

interface TicketRow {
  id: string
  ticket_code: string
  status: string
  purchased_at: string
  attended: boolean
  users: { username: string, city: string, tier: string } | { username: string, city: string, tier: string }[] | null
  ticket_types: { name: string, price: number } | { name: string, price: number }[] | null
  events: { title: string, event_date: string } | { title: string, event_date: string }[] | null
}

function getField<T>(val: T | T[] | null): T | null {
  if (!val) return null
  if (Array.isArray(val)) return val[0] || null
  return val
}

export default async function OrganiserAttendeesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string, event_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id, org_name')
    .eq('id', user.id)
    .single()
  if (!organiser) redirect('/login')

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const pageSize = 20
  const offset = (page - 1) * pageSize

  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date')
    .eq('organiser_id', user.id)
    .order('event_date', { ascending: false })

  const eventIds = events?.map(e => e.id) || []

  if (eventIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
          <Link href="/organiser/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
            paddy<span className="text-orange-500">meet</span>
          </Link>
          <div className="w-24" />
        </nav>
        <div className="pt-16 max-w-5xl mx-auto px-6 py-8 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4 mt-20" />
          <h2 className="text-lg font-bold text-gray-700 mb-2">No events yet</h2>
          <p className="text-sm text-gray-400 mb-5">Submit your first event to see attendees</p>
          <Link href="/organiser/dashboard/events/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors">
            Submit New Event
          </Link>
        </div>
      </div>
    )
  }

  let ticketsQuery = supabase
    .from('tickets')
    .select('id, ticket_code, status, purchased_at, attended, users(username, city, tier), ticket_types(name, price), events(title, event_date)', { count: 'exact' })
    .in('event_id', eventIds)
    .order('purchased_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (params.event_id) {
    ticketsQuery = ticketsQuery.eq('event_id', params.event_id)
  }

  const { data: rawTickets, count } = await ticketsQuery
  const tickets = rawTickets as unknown as TicketRow[]
  const totalPages = Math.ceil((count || 0) / pageSize)

  const { count: attendedCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('event_id', eventIds)
    .eq('attended', true)

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/organiser/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Attendees
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:border-gray-300 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </nav>

      <div className="pt-16 max-w-5xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Attendees</h1>
          <p className="text-sm text-gray-500">All ticket holders across your events</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total tickets', value: (count ?? 0).toLocaleString(), icon: Ticket, color: 'blue' },
            { label: 'Attended', value: (attendedCount ?? 0).toLocaleString(), icon: CheckCircle, color: 'green' },
            { label: 'Pending attendance', value: ((count ?? 0) - (attendedCount ?? 0)).toLocaleString(), icon: Clock, color: 'orange' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                color === 'blue' ? 'bg-blue-50' :
                color === 'green' ? 'bg-green-50' : 'bg-orange-50'
              }`}>
                <Icon className={`w-4 h-4 ${
                  color === 'blue' ? 'text-blue-500' :
                  color === 'green' ? 'text-green-500' : 'text-orange-500'
                }`} />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 tracking-tight mb-0.5">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Filter by event */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Link href="/organiser/dashboard/attendees"
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              !params.event_id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            All Events
          </Link>
          {events?.slice(0, 5).map(event => (
            <Link key={event.id}
              href={`/organiser/dashboard/attendees?event_id=${event.id}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                params.event_id === event.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {event.title}
            </Link>
          ))}
        </div>

        {/* Attendees table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-6 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
            {['Attendee', 'Event', 'Ticket', 'Date', 'Location', 'Status'].map(h => (
              <div key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>

          {tickets && tickets.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {tickets.map((ticket) => {
                const u = getField(ticket.users)
                const tt = getField(ticket.ticket_types)
                const ev = getField(ticket.events)
                return (
                  <div key={ticket.id} className="grid grid-cols-6 gap-3 px-5 py-4 hover:bg-gray-50 transition-colors items-center">

                    {/* Attendee */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u?.username?.replace('@', '').charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="text-xs font-bold text-gray-900 truncate">{u?.username || 'Unknown'}</div>
                    </div>

                    {/* Event */}
                    <div className="text-xs text-gray-600 truncate">{ev?.title || '—'}</div>

                    {/* Ticket type */}
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{tt?.name || 'Standard'}</div>
                      {tt?.price && <div className="text-xs text-gray-400">₦{tt.price.toLocaleString()}</div>}
                    </div>

                    {/* Purchase date */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {ticket.purchased_at
                        ? new Date(ticket.purchased_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : '—'}
                    </div>

                    {/* Location */}
                    <div className="text-xs text-gray-500">{u?.city || '—'}</div>

                    {/* Status */}
                    <div>
                      {ticket.attended ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 border border-green-200 text-xs font-bold rounded-full w-fit">
                          <CheckCircle className="w-3 h-3" /> Attended
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-500 border border-orange-200 text-xs font-bold rounded-full w-fit">
                          <Clock className="w-3 h-3" /> Upcoming
                        </span>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400 mb-1">No attendees yet</p>
              <p className="text-xs text-gray-400">Ticket holders will appear here once purchases are made</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500">
              Showing {offset + 1}–{Math.min(offset + pageSize, count || 0)} of {count?.toLocaleString()} attendees
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/organiser/dashboard/attendees?page=${page - 1}${params.event_id ? `&event_id=${params.event_id}` : ''}`}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <Link key={pageNum}
                    href={`/organiser/dashboard/attendees?page=${pageNum}${params.event_id ? `&event_id=${params.event_id}` : ''}`}
                    className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors flex items-center justify-center ${
                      pageNum === page ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {pageNum}
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link href={`/organiser/dashboard/attendees?page=${page + 1}${params.event_id ? `&event_id=${params.event_id}` : ''}`}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
      <SupportChat accountType="organiser" />
    </div>
  )
}