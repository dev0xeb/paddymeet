import SupportChat from '@/components/SupportChat'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  QrCode,
  ChevronRight,
  ArrowLeft,
  Search,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'
import UserAvatarMenu from '@/components/UserAvatarMenu'
import TicketQRModal from '@/components/TicketQRModal'
import NotificationsBell from '@/components/NotificationsBell'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('username, full_name, tier, trust_score')
    .eq('id', user.id)
    .single()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, ticket_types(name, price, is_group_ticket, group_size), events(id, title, event_date, start_time, venue_name, city, event_type, vibe, image_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeTickets = tickets?.filter(t => t.status === 'active') || []
  const pastTickets = tickets?.filter(t => t.status !== 'active') || []

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-900">

      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <Link href="/" className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
            paddy<span className="text-orange-600">meet</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/events"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200/60"
          >
            <Ticket className="w-3.5 h-3.5" /> Find Events
          </Link>
          <NotificationsBell />
          <UserAvatarMenu username={profile?.username || ''} tier={profile?.tier || 'Newbie'} />
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Digital Pass Vault
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                {activeTickets.length} Active {activeTickets.length === 1 ? 'Pass' : 'Passes'}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-normal">
              Present your QR passes at the venue gate for swift, frictionless verification.
            </p>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-600/20 active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <Search className="w-4 h-4" /> Book More Tickets
          </Link>
        </div>

        {/* Active Tickets List */}
        {activeTickets.length > 0 ? (
          <div className="space-y-4 mb-10">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Upcoming Event Passes ({activeTickets.length})</span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Gate Scan Ready
              </span>
            </div>

            {activeTickets.map((ticket) => {
              const event = ticket.events
              const ticketType = ticket.ticket_types
              const formattedDate = event?.event_date
                ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                : 'Date TBD'

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-orange-300 transition-all overflow-hidden p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Left Event Info */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md border border-slate-700">
                        <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                          {event?.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { month: 'short' }) : 'TBD'}
                        </span>
                        <span className="text-lg font-extrabold leading-none mt-0.5">
                          {event?.event_date ? new Date(event.event_date).getDate() : '--'}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {ticketType?.name && (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                              {ticketType.name} Tier
                            </span>
                          )}
                          {event?.event_type && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                              {event.event_type}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Pass
                          </span>
                        </div>

                        <h3 className="text-lg font-extrabold text-slate-900 truncate">
                          {event?.title || 'Event Pass'}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-xs text-slate-500 mt-2">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formattedDate} {event?.start_time ? `at ${event.start_time.substring(0, 5)}` : ''}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {event?.venue_name || event?.city}, {event?.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Code & Actions */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left sm:text-right w-full sm:w-auto">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Pass Code</div>
                        <div className="text-sm font-mono font-extrabold text-slate-900 tracking-wider">
                          {ticket.ticket_code}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                          href={`/events/${event?.id}`}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                        >
                          Event Info <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        <TicketQRModal
                          ticketCode={ticket.ticket_code}
                          eventTitle={event?.title || 'PaddyMeet Event'}
                          ticketTypeName={ticketType?.name || 'Standard Pass'}
                          eventDate={formattedDate}
                          venueName={event?.venue_name || event?.city || 'Venue'}
                          attendeeName={ticket.attendee_name || profile?.full_name || profile?.username}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center mb-10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4 text-orange-600">
              <Ticket className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Active Digital Passes</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              You do not have any upcoming event passes. Explore exciting nightlife events, table bookings, and concerts to secure your spot.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/20 transition-all"
            >
              <Search className="w-4 h-4" /> Browse Live Events
            </Link>
          </div>
        )}

        {/* Past Attended Tickets */}
        {pastTickets.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Past & Attended Events ({pastTickets.length})
            </div>
            <div className="space-y-2.5">
              {pastTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-slate-200/70 p-4 flex items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {ticket.events?.title?.charAt(0) || 'E'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {ticket.events?.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {ticket.events?.event_date
                          ? new Date(ticket.events.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Past Event'}{' '}
                        • {ticket.ticket_types?.name || 'Standard'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full flex-shrink-0 capitalize">
                    {ticket.status === 'used' ? 'Attended' : ticket.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <SupportChat accountType="explorer" />
    </div>
  )
}