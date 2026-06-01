import SupportChat from '@/components/SupportChat'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Ticket, Calendar, MapPin, Clock, QrCode, ChevronRight } from 'lucide-react'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, ticket_types(name, price, is_group_ticket, group_size), events(id, title, event_date, start_time, venue_name, city, event_type, vibe)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeTickets = tickets?.filter(t => t.status === 'active') || []
  const pastTickets = tickets?.filter(t => t.status !== 'active') || []

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
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-10 bg-white border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="w-20" />
      </nav>

      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-24 pb-12">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">My Tickets</h1>
          <p className="text-sm text-gray-500">
            {activeTickets.length} active {activeTickets.length === 1 ? 'ticket' : 'tickets'}
          </p>
        </div>

        {/* Active tickets */}
        {activeTickets.length > 0 ? (
          <div className="space-y-4 mb-8">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming</div>
            {activeTickets.map((ticket: {
              id: string
              ticket_code: string
              status: string
              created_at: string
              ticket_types: { name: string, price: number, is_group_ticket: boolean, group_size: number }
              events: { id: string, title: string, event_date: string, start_time: string, venue_name: string, city: string, event_type: string, vibe: string }
            }, index: number) => (
              <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

                {/* Event banner */}
                <div className={`h-28 bg-gradient-to-br ${gradients[index % gradients.length]} relative`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    {ticket.events?.event_type && (
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white">
                        {ticket.events.event_type}
                      </span>
                    )}
                    <span className="px-2.5 py-1 bg-green-500 rounded-full text-xs font-bold text-white">
                      Active
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="text-white font-extrabold text-base leading-tight truncate">
                      {ticket.events?.title}
                    </div>
                  </div>
                </div>

                {/* Ticket details */}
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-400 font-medium">Date</div>
                        <div className="text-xs font-bold text-gray-900">
                          {ticket.events?.event_date
                            ? new Date(ticket.events.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                            : 'TBC'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-400 font-medium">Time</div>
                        <div className="text-xs font-bold text-gray-900">
                          {ticket.events?.start_time ? ticket.events.start_time.slice(0, 5) : 'TBC'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-400 font-medium">Venue</div>
                        <div className="text-xs font-bold text-gray-900 truncate">
                          {ticket.events?.venue_name || 'TBC'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Ticket className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-400 font-medium">Ticket type</div>
                        <div className="text-xs font-bold text-gray-900">
                          {ticket.ticket_types?.name || 'Standard'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket code */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
                    <div>
                      <div className="text-xs text-gray-400 font-medium mb-0.5">Ticket code</div>
                      <div className="text-sm font-mono font-extrabold text-gray-900 tracking-wider">
                        {ticket.ticket_code}
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/events/${ticket.events?.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:border-orange-300 hover:text-orange-500 transition-all"
                    >
                      View Event <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors">
                      <QrCode className="w-3.5 h-3.5" /> Show QR Code
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center mb-8">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Ticket className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-2">No active tickets</h3>
            <p className="text-sm text-gray-400 mb-5">
              You have not bought any tickets yet. Find an event and get your tickets.
            </p>
            <Link href="/events" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
              Browse Events
            </Link>
          </div>
        )}

        {/* Past tickets */}
        {pastTickets.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Past Events</div>
            {pastTickets.map((ticket: {
              id: string
              ticket_code: string
              status: string
              events: { id: string, title: string, event_date: string, venue_name: string }
              ticket_types: { name: string }
            }, index: number) => (
              <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 opacity-70">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} flex-shrink-0 flex items-center justify-center text-white font-bold text-lg`}>
                  {ticket.events?.title?.charAt(0) || 'E'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{ticket.events?.title}</div>
                  <div className="text-xs text-gray-500">
                    {ticket.events?.event_date
                      ? new Date(ticket.events.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : ''} · {ticket.ticket_types?.name}
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full flex-shrink-0">
                  Attended
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
      <SupportChat accountType="explorer" />
    </div>
  )
}