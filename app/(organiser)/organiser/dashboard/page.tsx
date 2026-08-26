import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, Ticket,
  CreditCard,
  Plus, Clock, CheckCircle2, XCircle, Eye, TrendingUp,
  ArrowUpRight, Users, ShieldCheck, Sparkles, ChevronRight, AlertCircle
} from 'lucide-react'
import OrganiserNav from '@/components/OrganiserNav'
import SupportChat from '@/components/SupportChat'

export default async function OrganiserDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: organiser }, { data: events }, { data: settings }] = await Promise.all([
    supabase.from('organisers').select('*').eq('id', user.id).single(),
    supabase.from('events').select('*, ticket_types(*)').eq('organiser_id', user.id).order('created_at', { ascending: false }),
    supabase.from('platform_settings').select('platform_fee_percent').eq('id', 1).single(),
  ])

  if (!organiser) redirect('/login')

  const platformFeePercent = Number(settings?.platform_fee_percent) || 5.0
  const netPayoutPercent = Math.max(0, 100 - platformFeePercent)

  const eventIds = events?.map(e => e.id) || []
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .in('event_id', eventIds.length > 0 ? eventIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .limit(5)

  const totalRevenue = orders?.reduce((sum, o) => sum + (Number(o.total_paid) || 0), 0) || 0
  const feeAmount = totalRevenue * (platformFeePercent / 100)
  const netEstimatedPayout = Math.max(0, totalRevenue - feeAmount)
  const totalTickets = orders?.length || 0
  const liveEvents = events?.filter(e => e.is_live && e.is_approved).length || 0
  const pendingEvents = events?.filter(e => !e.is_approved).length || 0

  const statusConfig: Record<string, { label: string, color: string, icon: React.ElementType }> = {
    live: { label: 'Live', color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80', icon: CheckCircle2 },
    pending: { label: 'Pending Approval', color: 'text-amber-700 bg-amber-50 border-amber-200/80', icon: Clock },
    review: { label: 'In Review', color: 'text-blue-700 bg-blue-50 border-blue-200/80', icon: Eye },
    rejected: { label: 'Changes Requested', color: 'text-rose-700 bg-rose-50 border-rose-200/80', icon: XCircle },
    ended: { label: 'Ended', color: 'text-slate-600 bg-slate-100 border-slate-200/80', icon: CheckCircle2 },
  }

  const getEventStatus = (event: { is_approved: boolean, is_live: boolean }) => {
    if (!event.is_approved) return 'pending'
    if (event.is_live) return 'live'
    return 'ended'
  }

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased">
      <OrganiserNav orgName={organiser.org_name} contactName={organiser.contact_name} pendingEvents={pendingEvents} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Good Day, {organiser.contact_name?.split(' ')[0] || 'Organiser'}
              </h1>
              {organiser.is_verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Host
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  KYC Pending
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 font-normal">
              Overview of your active events, ticket velocity, and revenue metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/organiser/dashboard/events/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 shadow-sm shadow-orange-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> Create New Event
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Gross Revenue</span>
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 shadow-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              ₦{totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">Live</span> total sales generated
            </div>
          </div>

          {/* Tickets Sold */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Tickets Sold</span>
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-blue-400 shadow-sm">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {totalTickets.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              Confirmed attendees
            </div>
          </div>

          {/* Live Events */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Active Events</span>
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-orange-400 shadow-sm">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {liveEvents}
            </div>
            <div className="text-xs text-slate-500">
              Published and selling
            </div>
          </div>

          {/* Pending Approval */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Pending Review</span>
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {pendingEvents}
            </div>
            <div className="text-xs text-slate-500">
              Awaiting admin check
            </div>
          </div>
        </div>

        {/* Dashboard Grid (Main 2 Cols + Side Col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left / Main 2-Column Section */}
          <div className="lg:col-span-2 space-y-6">

            {/* My Events Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">My Events</h2>
                  <p className="text-xs text-slate-500">Manage your published and upcoming events</p>
                </div>
                <Link
                  href="/organiser/dashboard/events"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  View All Events <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {events && events.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {events.slice(0, 5).map((event) => {
                    const status = getEventStatus(event)
                    const StatusIcon = statusConfig[status]?.icon || Clock
                    return (
                      <Link
                        key={event.id}
                        href={`/organiser/dashboard/events/${event.id}`}
                        className="group flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-50/80 transition-all"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                            {event.title?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 group-hover:text-orange-600 truncate transition-colors">
                              {event.title}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>
                                {event.event_date
                                  ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : 'Date TBD'}
                              </span>
                              <span>•</span>
                              <span>{event.city || 'Lagos'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[status]?.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="hidden sm:inline">{statusConfig[status]?.label}</span>
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-sm text-slate-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">No events published yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                    Create and submit your first event with custom ticket tiers to start selling.
                  </p>
                  <Link
                    href="/organiser/dashboard/events/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 transition-all shadow-sm shadow-orange-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Submit First Event
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Orders / Transactions Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Ticket Sales</h2>
                  <p className="text-xs text-slate-500">Live feed of processed customer orders</p>
                </div>
                <Link
                  href="/organiser/dashboard/tickets"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  View All Orders <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {orders && orders.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 px-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {order.buyer_name || 'Attendee Ticket Order'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-900 flex-shrink-0">
                        +₦{Number(order.total_paid).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No ticket transactions recorded yet.
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar Section */}
          <div className="space-y-6">

            {/* Moderation / Status Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Event Moderation</h3>
                {pendingEvents > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    {pendingEvents} in review
                  </span>
                )}
              </div>

              {(events?.filter(e => !e.is_approved)?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {events?.filter(e => !e.is_approved).slice(0, 3).map((event) => (
                    <div key={event.id} className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-xl">
                      <div className="text-xs font-bold text-slate-900 truncate mb-1">{event.title}</div>
                      <div className="text-[11px] text-slate-500 mb-2">
                        Submitted {new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Under review by PaddyMeet Ops
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    New submissions are vetted within 24 hours to ensure attendee trust & ticketing safety.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">All submissions up to date</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">No events pending moderation review.</p>
                </div>
              )}
            </div>

            {/* Payout Overview Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-slate-800">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Estimated Payout</span>
                  <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full text-slate-200">
                    Net {netPayoutPercent}%
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
                  ₦{netEstimatedPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  After platform service & payment processing fees
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Gross Sales</div>
                    <div className="text-xs font-bold text-white mt-0.5">₦{totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Paddy Fee ({platformFeePercent}%)</div>
                    <div className="text-xs font-bold text-slate-300 mt-0.5">₦{feeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>

                <Link
                  href="/organiser/dashboard/payouts"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all shadow-sm"
                >
                  Manage Payouts & Settlement <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Navigation</h3>
              <div className="space-y-1">
                {[
                  { icon: Plus, label: 'Submit a new event', href: '/organiser/dashboard/events/new' },
                  { icon: Users, label: 'Attendee check-in list', href: '/organiser/dashboard/attendees' },
                  { icon: CreditCard, label: 'Bank & payout settings', href: '/organiser/dashboard/settings' },
                ].map(({ icon: Icon, label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold flex-1">{label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      <SupportChat accountType="organiser" />
    </div>
  )
}