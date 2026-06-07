import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, Ticket,
  CreditCard, BarChart2, Settings,
  Plus, Clock, CheckCircle, XCircle, Eye, TrendingUp,
  ArrowUpRight, Users, LayoutDashboard
} from 'lucide-react'
import OrganiserNav from '@/components/OrganiserNav'
import SupportChat from '@/components/SupportChat'

export default async function OrganiserDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: organiser }, { data: events }] = await Promise.all([
    supabase.from('organisers').select('*').eq('id', user.id).single(),
    supabase.from('events').select('*, ticket_types(*)').eq('organiser_id', user.id).order('created_at', { ascending: false }),
  ])

  if (!organiser) redirect('/login')

  const eventIds = events?.map(e => e.id) || []
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .in('event_id', eventIds.length > 0 ? eventIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .limit(5)

  const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0
  const totalTickets = orders?.length || 0
  const liveEvents = events?.filter(e => e.is_live && e.is_approved).length || 0
  const pendingEvents = events?.filter(e => !e.is_approved).length || 0

  const statusConfig: Record<string, { label: string, color: string, icon: React.ElementType }> = {
    live: { label: 'Live', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle },
    pending: { label: 'Pending', color: 'text-orange-500 bg-orange-50 border-orange-200', icon: Clock },
    review: { label: 'In Review', color: 'text-blue-500 bg-blue-50 border-blue-200', icon: Eye },
    rejected: { label: 'Rejected', color: 'text-red-500 bg-red-50 border-red-200', icon: XCircle },
    ended: { label: 'Ended', color: 'text-gray-500 bg-gray-50 border-gray-200', icon: CheckCircle },
  }

  const getEventStatus = (event: { is_approved: boolean, is_live: boolean }) => {
    if (!event.is_approved) return 'pending'
    if (event.is_live) return 'live'
    return 'ended'
  }

  const navLinks = [
    { icon: LayoutDashboard, label: 'Overview', href: '/organiser/dashboard' },
    { icon: Calendar, label: 'My Events', href: '/organiser/dashboard/events' },
    { icon: Ticket, label: 'Ticket Sales', href: '/organiser/dashboard/tickets' },
    { icon: Users, label: 'Attendees', href: '/organiser/dashboard/attendees' },
    { icon: TrendingUp, label: 'Revenue', href: '/organiser/dashboard/revenue' },
    { icon: CreditCard, label: 'Payouts', href: '/organiser/dashboard/payouts' },
    { icon: Settings, label: 'Settings', href: '/organiser/dashboard/settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganiserNav orgName={organiser.org_name} pendingEvents={pendingEvents} />

      <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-100 md:hidden">
        <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
          {navLinks.map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex-shrink-0">
              <Icon className="w-3 h-3" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex pt-16">

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-56 fixed top-16 left-0 bottom-0 bg-white border-r border-gray-100 flex-col py-5 px-3">
          <div className="space-y-0.5 flex-1">
            {navLinks.slice(0, 4).map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all">
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-0.5">
            <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Finance</div>
            {navLinks.slice(4, 6).map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all">
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
            <Link href="/organiser/dashboard/reports"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all">
              <BarChart2 className="w-4 h-4 flex-shrink-0" />
              Reports
            </Link>
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-0.5">
            <Link href="/organiser/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all">
              <Settings className="w-4 h-4 flex-shrink-0" />
              Settings
            </Link>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {organiser.org_name?.charAt(0) || 'O'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">{organiser.org_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-green-600">Active Organiser</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="w-full md:ml-56 flex-1 p-4 md:p-8 mt-12 md:mt-0">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
                Good morning, {organiser.contact_name?.split(' ')[0]}
              </h1>
              <p className="text-sm text-gray-500">Here is how your events are performing</p>
            </div>
            <Link href="/organiser/dashboard/events/new"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-all sm:w-auto w-full">
              <Plus className="w-4 h-4" /> Submit New Event
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {[
              { label: 'Tickets sold', value: totalTickets.toLocaleString(), icon: Ticket, color: 'blue' },
              { label: 'Total revenue', value: `₦${(totalRevenue/1000).toFixed(0)}k`, icon: TrendingUp, color: 'green' },
              { label: 'Live events', value: liveEvents.toString(), icon: Calendar, color: 'orange' },
              { label: 'Pending approval', value: pendingEvents.toString(), icon: Clock, color: 'purple' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
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
                <div className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight mb-0.5">{value}</div>
                <div className="text-xs text-gray-500 font-medium">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">

            {/* Events table */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-extrabold text-gray-900">My Events</h2>
                  <Link href="/organiser/dashboard/events" className="text-xs font-bold text-blue-500 hover:underline">View all →</Link>
                </div>

                {events && events.length > 0 ? (
                  <div className="space-y-2">
                    {events.slice(0, 5).map((event) => {
                      const status = getEventStatus(event)
                      const StatusIcon = statusConfig[status]?.icon || Clock
                      return (
                        <Link key={event.id} href={`/organiser/dashboard/events/${event.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                            {event.title?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">{event.title}</div>
                            <div className="text-xs text-gray-500">
                              {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                          </div>
                          <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${statusConfig[status]?.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[status]?.label}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                      <Calendar className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400 mb-1">No events yet</p>
                    <p className="text-xs text-gray-400 mb-4">Submit your first event to get started</p>
                    <Link href="/organiser/dashboard/events/new"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors">
                      <Plus className="w-3 h-3" /> Submit Event
                    </Link>
                  </div>
                )}
              </div>

              {/* Recent transactions */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-extrabold text-gray-900">Recent Transactions</h2>
                  <Link href="/organiser/dashboard/revenue" className="text-xs font-bold text-blue-500 hover:underline">View all →</Link>
                </div>
                {orders && orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <Ticket className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900">Ticket purchase</div>
                          <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="text-sm font-bold text-green-600 flex-shrink-0">+₦{order.total_paid?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">No transactions yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* Pending approvals */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-extrabold text-gray-900">Pending Approval</h2>
                  {pendingEvents > 0 && (
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-500 border border-orange-200 text-xs font-bold rounded-full">
                      {pendingEvents}
                    </span>
                  )}
                </div>
                {(events?.filter(e => !e.is_approved)?.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    {events?.filter(e => !e.is_approved).slice(0, 3).map((event) => (
                      <div key={event.id} className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                        <div className="text-xs font-bold text-gray-900 mb-1 truncate">{event.title}</div>
                        <div className="text-xs text-gray-500 mb-2">
                          Submitted {new Date(event.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-500">
                          <Clock className="w-3 h-3" />
                          Awaiting Paddymeet review
                        </div>
                      </div>
                    ))}
                    <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 text-center leading-relaxed">
                      Usually reviewed within 24–48 hours.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No pending approvals</p>
                  </div>
                )}
              </div>

              {/* Payout card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
                <div className="relative">
                  <div className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Next Payout</div>
                  <div className="text-3xl font-extrabold text-white tracking-tight mb-1">
                    ₦{(totalRevenue * 0.9 / 1000).toFixed(0)}k
                  </div>
                  <div className="text-xs text-blue-200 mb-4">After Paddymeet commission</div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white/15 rounded-xl p-3">
                      <div className="text-xs text-blue-200 mb-0.5">Gross</div>
                      <div className="text-sm font-bold text-white">₦{(totalRevenue/1000).toFixed(0)}k</div>
                    </div>
                    <div className="bg-white/15 rounded-xl p-3">
                      <div className="text-xs text-blue-200 mb-0.5">Commission</div>
                      <div className="text-sm font-bold text-white">₦{(totalRevenue * 0.1/1000).toFixed(0)}k</div>
                    </div>
                  </div>
                  <Link href="/organiser/dashboard/payouts"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 transition-colors">
                    View Payout Details <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h2 className="text-sm font-extrabold text-gray-900 mb-3">Quick Actions</h2>
                <div className="space-y-1">
                  {[
                    { icon: Plus, label: 'Submit a new event', href: '/organiser/dashboard/events/new' },
                    { icon: BarChart2, label: 'Sales report', href: '/organiser/dashboard/reports' },
                    { icon: Users, label: 'Attendee list', href: '/organiser/dashboard/attendees' },
                    { icon: CreditCard, label: 'Bank details', href: '/organiser/dashboard/settings' },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link key={label} href={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-gray-50">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 flex-1">{label}</span>
                      <ArrowUpRight className="w-3 h-3 text-gray-300" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <SupportChat accountType="organiser" />
    </div>
  )
}