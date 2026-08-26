import SupportChat from '@/components/SupportChat'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Calendar,
  MapPin,
  Clock,
  MessageCircle,
  Plus,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Share2,
  ChevronRight,
  ShieldCheck,
  Ticket
} from 'lucide-react'
import UserAvatarMenu from '@/components/UserAvatarMenu'
import OpenGroupButton from '@/components/OpenGroupButton'
import NotificationsBell from '@/components/NotificationsBell'
import StartSquadModal from '@/components/StartSquadModal'

export default async function MyGroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: groupMemberships }, { data: liveEvents }] = await Promise.all([
    supabase
      .from('users')
      .select('username, full_name, tier, trust_score')
      .eq('id', user.id)
      .single(),
    supabase
      .from('group_members')
      .select('*, groups(*, events(id, title, event_date, start_time, venue_name, city, event_type, vibe, image_url), ticket_types(name, price, is_group_ticket, group_size, group_deadline))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('events')
      .select('id, title, event_date, start_time, venue_name, city, vibe, ticket_types(id, name, price, is_group_ticket, group_size)')
      .eq('is_approved', true)
      .eq('is_live', true)
      .order('event_date', { ascending: true })
  ])

  const memberships = groupMemberships || []
  const activeSquads = memberships.filter(m => {
    const grp = Array.isArray(m.groups) ? m.groups[0] : m.groups
    return grp?.status !== 'failed'
  })

  const completedSquads = memberships.filter(m => {
    const grp = Array.isArray(m.groups) ? m.groups[0] : m.groups
    return grp?.status === 'completed'
  })

  const pendingPayments = memberships.filter(m => m.payment_status === 'pending')

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                My Squads & Table Groups
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <Users className="w-3.5 h-3.5 text-purple-600" /> {memberships.length} Total Groups
              </span>
            </div>
            <p className="text-sm text-slate-500 font-normal">
              Coordinate split-payment table bookings, chat with your event squad in real-time, and track payment deadlines.
            </p>
          </div>

          <StartSquadModal liveEvents={liveEvents || []} />
        </div>

        {/* Telemetry Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Squads</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{activeSquads.length}</div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">Live table groups</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pending Shares</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{pendingPayments.length}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Awaiting checkout</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Secured Tables</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{completedSquads.length}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">100% paid & confirmed</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trust Rating</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{profile?.trust_score || 50}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">{profile?.tier || 'Explorer'} Tier</div>
          </div>

        </div>

        {/* Squad Cards Feed */}
        {memberships.length > 0 ? (
          <div className="space-y-4">
            {memberships.map((membership) => {
              const group = Array.isArray(membership.groups) ? membership.groups[0] : membership.groups
              const event = Array.isArray(group?.events) ? group?.events[0] : group?.events
              const ticketType = Array.isArray(group?.ticket_types) ? group?.ticket_types[0] : group?.ticket_types

              const isPaid = membership.payment_status === 'paid'
              const isGroupAdmin = membership.role === 'admin'
              const formattedDate = event?.event_date
                ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                : 'Date TBD'

              const targetMembers = ticketType?.group_size || group?.max_members || 4
              const sharePrice = ticketType?.price ? Math.round(ticketType.price / targetMembers) : 0

              return (
                <div
                  key={membership.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-purple-200 transition-all p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Left: Squad & Event Info */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-600/20">
                        {group?.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-base font-extrabold text-slate-900 truncate">
                            {group?.name || 'Squad Table'}
                          </span>
                          {isGroupAdmin && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Squad Host
                            </span>
                          )}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {isPaid ? 'My Share: Paid' : 'My Share: Pending'}
                          </span>
                        </div>

                        <div className="text-sm font-semibold text-slate-700 truncate mb-2">
                          Event: {event?.title || 'Exclusive Nightlife Event'}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-xs text-slate-500">
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

                    {/* Right: Payment Status & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left sm:text-right w-full sm:w-auto">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Individual Share</div>
                        <div className="text-base font-extrabold text-slate-900">
                          ₦{sharePrice > 0 ? sharePrice.toLocaleString() : 'Free'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {event && (
                          <Link
                            href={`/events/${event.id}`}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                          >
                            View Event <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {group && (
                          <OpenGroupButton
                            groupId={group.id}
                            groupName={group.name}
                            eventTitle={event?.title || group.name}
                          />
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center mb-10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto mb-4 text-purple-600">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Squad Groups Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              You haven't joined or created an event squad yet. Discover group-enabled table events to split bills and party with your friends.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/20 transition-all"
            >
              <Search className="w-4 h-4" /> Find Squad Table Events
            </Link>
          </div>
        )}

      </main>

      <SupportChat accountType="explorer" />
    </div>
  )
}
