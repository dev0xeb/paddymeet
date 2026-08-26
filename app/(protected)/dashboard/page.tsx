import NotificationsBell from '@/components/NotificationsBell'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Users,
  ChevronRight,
  ShieldCheck,
  Ticket,
  Search,
  QrCode,
  Gift,
  Tag,
  MapPin,
  Clock,
  Flame,
  CreditCard,
  Headphones
} from 'lucide-react'
import UserAvatarMenu from '@/components/UserAvatarMenu'
import SupportChat from '@/components/SupportChat'
import OpenGroupButton from '@/components/OpenGroupButton'
import ReferralCopyButton from '@/components/ReferralCopyButton'
import TicketQRModal from '@/components/TicketQRModal'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch user profile, tickets, groups, promos, and all upcoming live events in parallel
  const [
    { data: profile },
    { data: tickets },
    { data: groupMembers },
    { data: activePromos },
    { count: referralsCount },
    { data: upcomingLiveEvents }
  ] = await Promise.all([
    supabase.from('users').select('*, user_interests(*)').eq('id', user.id).single(),
    supabase.from('tickets').select('*, ticket_types(name, price, is_group_ticket, group_size), events(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('group_members').select('*, groups(*, events(id, title, event_date, city, venue_name), ticket_types(name, price, is_group_ticket))').eq('user_id', user.id).limit(4),
    supabase.from('promo_codes').select('*').eq('is_active', true).limit(3),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('referred_by', user.id),
    supabase.from('events').select('*, ticket_types(name, price, quantity, quantity_sold), organisers(org_name, is_verified)').eq('is_approved', true).eq('is_live', true).order('event_date', { ascending: true })
  ])

  if (!profile) redirect('/login')

  // Auto-generate and persist referral code if missing
  let referralCode = profile.referral_code
  if (!referralCode) {
    const cleanUser = (profile.username || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const idPrefix = user.id.substring(0, 4).toUpperCase()
    referralCode = `PADDY-${cleanUser}-${idPrefix}`
    await supabase.from('users').update({ referral_code: referralCode }).eq('id', user.id)
  }

  // Dynamic calculations
  const allTickets = tickets || []
  const activeTickets = allTickets.filter(t => t.status === 'active')
  const usedTickets = allTickets.filter(t => t.status === 'used' || t.attended === true)
  const eventsAttended = usedTickets.length
  const trustScore = Number(profile.trust_score) || 50

  const tierColors: Record<string, { badge: string, bar: string, text: string }> = {
    Newbie: { badge: 'bg-slate-100 text-slate-700 border-slate-200', bar: 'bg-slate-500', text: 'text-slate-700' },
    Social: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', text: 'text-emerald-700' },
    Crew: { badge: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500', text: 'text-blue-700' },
    Elite: { badge: 'bg-purple-50 text-purple-700 border-purple-200', bar: 'bg-purple-500', text: 'text-purple-700' },
    Legendary: { badge: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-500', text: 'text-amber-700' },
  }

  const tierProgress: Record<string, number> = {
    Newbie: 25,
    Social: 50,
    Crew: 68,
    Elite: 85,
    Legendary: 100
  }

  const tier = profile.tier || 'Newbie'
  const progress = tierProgress[tier] || 25
  const currentTierTheme = tierColors[tier] || tierColors.Newbie
  const groupsList = groupMembers || []
  const activeGroupsCount = groupsList.length
  const liveEvents = upcomingLiveEvents || []

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-900">

      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
            paddy<span className="text-orange-600">meet</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link href="/events" className="hover:text-slate-900 transition-colors">
              Browse Events
            </Link>
            <Link href="/tickets" className="hover:text-slate-900 transition-colors">
              My Tickets {activeTickets.length > 0 && `(${activeTickets.length})`}
            </Link>
            <Link href="/how-it-works" className="hover:text-slate-900 transition-colors">
              How It Works
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/events"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200/60"
          >
            <Ticket className="w-3.5 h-3.5" /> Find Events
          </Link>
          <NotificationsBell />
          <UserAvatarMenu username={profile.username} tier={tier} />
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/50">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -top-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur-md border border-white/15">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Explorer
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                {tier} Member
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Welcome back, {profile.full_name?.split(' ')[0] || profile.username}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl font-normal">
              Manage your event passes, coordinate squad tables, track rewards, and explore curated nightlife experiences.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <Link
              href="/tickets"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all"
            >
              <QrCode className="w-4 h-4 text-orange-400" /> My Passes ({activeTickets.length})
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-600/30 transition-all active:scale-[0.98]"
            >
              <Search className="w-4 h-4" /> Explore Events
            </Link>
          </div>
        </div>

        {/* Top Dynamic Telemetry / Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Active Passes */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Passes</span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTickets.length}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              {activeTickets.length > 0 ? (
                <span className="text-emerald-600 font-semibold">Ready for gate scan</span>
              ) : (
                <span>0 active passes</span>
              )}
            </div>
          </div>

          {/* Trust Score */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trust Score</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {trustScore} <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${currentTierTheme.bar}`} />
              <span className={currentTierTheme.text}>{tier} Rank</span>
            </div>
          </div>

          {/* Events Attended */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Events Attended</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {eventsAttended}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {eventsAttended === 0
                ? '0 completed events'
                : `${eventsAttended} verified ${eventsAttended === 1 ? 'attendance' : 'attendances'}`}
            </div>
          </div>

          {/* Squads & Groups */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Squads & Tables</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeGroupsCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Active split-share chats
            </div>
          </div>

        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. MY ACTIVE PASSES (Personal purchased tickets filter) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">My Active Passes</h2>
                    <p className="text-xs text-slate-500">Your purchased tickets ready for venue check-in</p>
                  </div>
                </div>
                <Link
                  href="/tickets"
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                >
                  View all ({activeTickets.length}) <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6">
                {activeTickets.length > 0 ? (
                  <div className="space-y-3.5">
                    {activeTickets.map((ticket) => {
                      const event = ticket.events
                      const ticketType = ticket.ticket_types
                      const formattedDate = event?.event_date
                        ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Date TBD'

                      return (
                        <div
                          key={ticket.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-orange-200/80 bg-orange-50/20 hover:bg-orange-50/40 transition-all"
                        >
                          <div className="flex items-start sm:items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-sm border border-slate-700">
                              <span className="text-xs font-bold text-orange-400 uppercase">
                                {event?.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { month: 'short' }) : 'TBD'}
                              </span>
                              <span className="text-sm font-extrabold">
                                {event?.event_date ? new Date(event.event_date).getDate() : '--'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 truncate">
                                  {event?.title || 'Event Ticket'}
                                </span>
                                {ticketType?.name && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700">
                                    {ticketType.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {event?.venue_name || event?.city || 'Venue TBD'}
                                </span>
                                <span>•</span>
                                <span className="font-mono text-slate-600 font-semibold">{ticket.ticket_code}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                            <TicketQRModal
                              ticketCode={ticket.ticket_code}
                              eventTitle={event?.title || 'PaddyMeet Event'}
                              ticketTypeName={ticketType?.name || 'Standard'}
                              eventDate={formattedDate}
                              venueName={event?.venue_name || event?.city || 'Venue'}
                              attendeeName={ticket.attendee_name || profile.full_name || profile.username}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-3 text-orange-600">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">No Active Passes</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      You do not have any active tickets right now. Explore upcoming parties, festivals, and concerts below to book your pass.
                    </p>
                    <Link
                      href="/events"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                    >
                      <Search className="w-3.5 h-3.5" /> Find Live Events
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 2. UPCOMING EVENTS (Platform-Wide Live Events Discovery Feed) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Upcoming Events</h2>
                    <p className="text-xs text-slate-500">Discover and book tickets for experiences happening near you</p>
                  </div>
                </div>
                <Link
                  href="/events"
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                >
                  View all ({liveEvents.length}) <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6">
                {liveEvents.length > 0 ? (
                  <div className="space-y-4">
                    {liveEvents.map((evt) => {
                      const minPrice = evt.ticket_types && evt.ticket_types.length > 0
                        ? Math.min(...evt.ticket_types.map((t: { price: number }) => Number(t.price) || 0))
                        : 0

                      const formattedDate = evt.event_date
                        ? new Date(evt.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Date TBD'

                      const isFeatured = evt.is_featured

                      return (
                        <div
                          key={evt.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition-all bg-slate-50/50 group"
                        >
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md border border-slate-700 relative overflow-hidden">
                              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                                {evt.event_date ? new Date(evt.event_date).toLocaleDateString('en-GB', { month: 'short' }) : 'TBD'}
                              </span>
                              <span className="text-base font-extrabold leading-none mt-0.5">
                                {evt.event_date ? new Date(evt.event_date).getDate() : '--'}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                {isFeatured && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Flame className="w-3 h-3 text-amber-500" /> Featured
                                  </span>
                                )}
                                {evt.event_type && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                                    {evt.event_type}
                                  </span>
                                )}
                                {evt.vibe && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
                                    {evt.vibe}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                {evt.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1">
                                <span className="flex items-center gap-1 font-medium">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {formattedDate} {evt.start_time ? `at ${evt.start_time.substring(0, 5)}` : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  {evt.venue_name || evt.city}, {evt.city}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 flex-shrink-0">
                            <div className="text-left sm:text-right">
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">Tickets From</div>
                              <div className="text-base font-extrabold text-slate-900">
                                {minPrice === 0 ? 'Free Entry' : `₦${minPrice.toLocaleString()}`}
                              </div>
                            </div>
                            <Link
                              href={`/events/${evt.id}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-600/20 active:scale-[0.98] transition-all"
                            >
                              <Ticket className="w-3.5 h-3.5" /> Book Pass
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-3 text-orange-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">No Upcoming Events Yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Check back shortly or browse our events catalogue to see newly listed concerts, parties, and raves.
                    </p>
                    <Link
                      href="/events"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                    >
                      <Search className="w-3.5 h-3.5" /> Browse Catalogue
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 3. My Squads & Group Split Tables */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Squad Tables & Group Chats</h2>
                    <p className="text-xs text-slate-500">Active table splits and group communications</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {groupsList.length > 0 ? (
                  <div className="space-y-3.5">
                    {groupsList.map((member) => {
                      const group = Array.isArray(member.groups) ? member.groups[0] : member.groups
                      const event = Array.isArray(group?.events) ? group?.events[0] : group?.events
                      const isPaid = member.payment_status === 'paid'

                      return (
                        <div
                          key={member.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/70 hover:border-purple-200 hover:bg-purple-50/20 transition-all bg-slate-50/50"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                              {group?.name?.charAt(0)?.toUpperCase() || 'G'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 truncate">
                                  {group?.name || 'Squad Group'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                  {isPaid ? 'Paid Share' : 'Pending Share'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1 truncate">
                                Event: <span className="font-semibold text-slate-700">{event?.title || 'Multi-Event'}</span>
                                {event?.city && ` • ${event.city}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {group && (
                              <OpenGroupButton
                                groupId={group.id}
                                groupName={group.name}
                                eventTitle={event?.title || group.name}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto mb-3 text-purple-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">No Active Squads Yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Join a table group or create a split-payment squad with your friends on any group-enabled event.
                    </p>
                    <Link
                      href="/events"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      <Users className="w-3.5 h-3.5" /> Find Squad Events
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (1 Col) */}
          <div className="space-y-6">

            {/* Profile & Trust Tier Progress Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-orange-500/20">
                  {profile.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-slate-900 truncate">
                    {profile.full_name || profile.username}
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">@{profile.username}</div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${currentTierTheme.badge}`}>
                  {tier}
                </span>
              </div>

              {/* Trust Score Meter */}
              <div className="mb-4 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-orange-500" /> Platform Trust Score
                  </span>
                  <span className="font-extrabold text-slate-900">{trustScore} / 100</span>
                </div>
                <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Attend verified events and maintain active attendance to unlock higher trust perks.
                </p>
              </div>

              {/* User Interests */}
              {profile.user_interests && profile.user_interests.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">My Vibe & Interests</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.user_interests.slice(0, 6).map((i: { interest: string }) => (
                      <span
                        key={i.interest}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200/60"
                      >
                        {i.interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Wallet & Rewards Hub */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-500" /> Wallet & Perks
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-4 mb-4 relative overflow-hidden">
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Paddy Balance</div>
                <div className="text-2xl font-extrabold tracking-tight">
                  ₦{(profile.profile_balance || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <span>Referral Points:</span>
                  <span className="font-bold text-orange-400">{profile.referral_points || 0} pts</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Active Platform Promos
                  </span>
                  <span className="font-bold text-slate-900">{activePromos?.length || 0} available</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Direct Referrals
                  </span>
                  <span className="font-bold text-slate-900">{referralsCount || 0} joined</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-slate-400" /> Reward Discount Ready
                  </span>
                  <span className="font-bold text-orange-600">{profile.referral_discount_percent || 10}% OFF</span>
                </div>
              </div>
            </div>

            {/* Referral & Invite Card */}
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-2xl p-6 shadow-lg shadow-orange-600/20">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-orange-200" />
                <h3 className="text-sm font-bold text-white">Invite Squad & Earn Perks</h3>
              </div>
              <p className="text-xs text-orange-100 mb-4 leading-relaxed font-normal">
                Share your personal link with friends. Earn bonus points and discounts on future event tickets whenever they join.
              </p>

              <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 flex items-center justify-between mb-3 border border-white/10">
                <span className="text-xs font-mono font-bold tracking-wide truncate text-white">
                  {referralCode}
                </span>
                <ReferralCopyButton code={referralCode} />
              </div>

              <div className="flex items-center justify-between text-[11px] text-orange-100 pt-1">
                <span>Earn 10 points per sign-up</span>
                <span className="font-semibold text-white">100% Free</span>
              </div>
            </div>

            {/* VIP Concierge Support */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between gap-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Need Help with a Ticket?</div>
                  <div className="text-[11px] text-slate-500">24/7 in-app attendee support desk</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      <SupportChat accountType="explorer" />
    </div>
  )
}