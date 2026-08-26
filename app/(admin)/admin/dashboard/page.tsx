import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Tag, Star, Calendar, Ticket, DollarSign, Shield, Bell,
  Settings, BarChart2, Flag, CheckCircle, XCircle,
  AlertCircle, TrendingUp, Eye, ChevronRight,
  Megaphone, Search, UserCheck, Database, Clock, ShieldCheck
} from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import AdminApproveEventButton from '@/components/AdminApproveEventButton'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!admin) redirect('/admin-login')

  const [
    { count: totalUsers },
    { count: totalOrganisers },
    { count: pendingOrganisersCount },
    { count: liveEventsCount },
    { count: pendingEventsCount },
    { count: totalTickets },
    { data: recentUsers },
    { data: pendingEventsList },
    { data: pendingOrganisersList },
    { data: recentOrders },
  ] = await Promise.all([
    adminClient.from('users').select('*', { count: 'exact', head: true }),
    adminClient.from('organisers').select('*', { count: 'exact', head: true }),
    adminClient.from('organisers').select('*', { count: 'exact', head: true }).eq('is_verified', false),
    adminClient.from('events').select('*', { count: 'exact', head: true }).eq('is_approved', true).eq('is_live', true),
    adminClient.from('events').select('*', { count: 'exact', head: true }).eq('is_approved', false).eq('is_rejected', false),
    adminClient.from('tickets').select('*', { count: 'exact', head: true }),
    adminClient.from('users').select('id, username, city, state, created_at').order('created_at', { ascending: false }).limit(5),
    adminClient.from('events').select('*, organisers(id, org_name, contact_name, is_verified)').eq('is_approved', false).eq('is_rejected', false).order('created_at', { ascending: false }).limit(5),
    adminClient.from('organisers').select('id, org_name, contact_name, email, created_at').eq('is_verified', false).order('created_at', { ascending: false }).limit(5),
    adminClient.from('orders').select('*, events(title)').order('created_at', { ascending: false }).limit(5),
  ])

  const totalRevenue = recentOrders?.reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0
  const isSuperAdmin = admin.department === 'super_admin'

  const navItems = [
    { icon: BarChart2, label: 'Overview', href: '/admin/dashboard', active: true, depts: ['super_admin', 'support', 'finance', 'marketing', 'operations'] },
    { icon: Users, label: 'Users', href: '/admin/dashboard/users', depts: ['super_admin', 'support', 'operations'] },
    { icon: UserCheck, label: 'Organisers', href: '/admin/dashboard/organisers', badge: pendingOrganisersCount || 0, depts: ['super_admin', 'support', 'operations'] },
    { icon: Calendar, label: 'Events', href: '/admin/dashboard/events', badge: pendingEventsCount || 0, depts: ['super_admin', 'support', 'marketing', 'operations'] },
    { icon: Ticket, label: 'Tickets', href: '/admin/dashboard/tickets', depts: ['super_admin', 'support', 'operations'] },
    { icon: DollarSign, label: 'Payments', href: '/admin/dashboard/payments', depts: ['super_admin', 'finance'] },
    { icon: TrendingUp, label: 'Revenue', href: '/admin/dashboard/revenue', depts: ['super_admin', 'finance'] },
    { icon: Megaphone, label: 'Announcements', href: '/admin/dashboard/announcements', depts: ['super_admin', 'marketing'] },
    { icon: Search, label: 'AI Scanner', href: '/admin/dashboard/scanner', depts: ['super_admin', 'marketing'] },
    { icon: Flag, label: 'Reports', href: '/admin/dashboard/reports', depts: ['super_admin', 'support'] },
    { icon: Shield, label: 'Trust Scores', href: '/admin/dashboard/trust', depts: ['super_admin', 'support'] },
    { icon: Database, label: 'Support Tickets', href: '/admin/dashboard/support', depts: ['super_admin', 'support'] },
    { icon: DollarSign, label: 'Payouts', href: '/admin/dashboard/payouts', depts: ['super_admin', 'finance'] },
    { icon: Tag, label: 'Promo Codes', href: '/admin/dashboard/promo-codes', depts: ['super_admin', 'marketing'] },
    { icon: Star, label: 'Featured', href: '/admin/dashboard/featured', depts: ['super_admin', 'marketing'] },
    { icon: Settings, label: 'Platform Settings', href: '/admin/dashboard/platform-settings', depts: ['super_admin'] },
  ]

  const visibleNavItems = navItems.filter(item => item.depts.includes(admin.department))

  return (
    <div className="min-h-screen bg-slate-50 antialiased">

      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-white tracking-tight">
            paddy<span className="text-orange-500">meet</span>
          </Link>
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Admin Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/events"
            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:border-slate-600 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {((pendingEventsCount ?? 0) + (pendingOrganisersCount ?? 0)) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {(pendingEventsCount ?? 0) + (pendingOrganisersCount ?? 0)}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
              {admin.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <span className="text-xs font-semibold text-white">{admin.full_name || 'Admin'}</span>
              <span className="ml-2 text-[10px] text-orange-400 font-medium capitalize bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                {admin.department?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">

        {/* Sidebar */}
        <aside className="w-56 fixed top-16 left-0 bottom-0 bg-slate-900 border-r border-slate-800 flex flex-col py-5 px-3">
          <div className="space-y-0.5 flex-1 overflow-y-auto pr-1">
            {visibleNavItems.map(({ icon: Icon, label, href, active, badge }) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </div>
                {badge && badge > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-orange-500 text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-0.5">
            {isSuperAdmin && (
              <Link
                href="/admin/dashboard/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Settings className="w-4 h-4" /> Settings & Team
              </Link>
            )}
            <LogoutButton redirectTo="/admin-login" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-all" />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="ml-56 flex-1 p-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-7">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Command Centre</h1>
              <p className="text-xs text-slate-500">Live platform operations and moderation queues</p>
            </div>
            {((pendingEventsCount ?? 0) + (pendingOrganisersCount ?? 0)) > 0 && (
              <div className="flex items-center gap-2">
                {(pendingEventsCount ?? 0) > 0 && (
                  <Link
                    href="/admin/dashboard/events"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold rounded-xl hover:bg-orange-100 transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {pendingEventsCount} event{pendingEventsCount === 1 ? '' : 's'} to review
                  </Link>
                )}
                {(pendingOrganisersCount ?? 0) > 0 && (
                  <Link
                    href="/admin/dashboard/organisers"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {pendingOrganisersCount} KYC pending
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            
            {/* Total Users */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Users</span>
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
                {(totalUsers ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">Active explorers & buyers</div>
            </div>

            {/* Organisers */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Organisers</span>
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-purple-400">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
                {(totalOrganisers ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                {(pendingOrganisersCount ?? 0) > 0 ? (
                  <span className="text-amber-600 font-semibold">{pendingOrganisersCount} KYC pending</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">All verified</span>
                )}
              </div>
            </div>

            {/* Live Events */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Events</span>
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
                {(liveEventsCount ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                {(pendingEventsCount ?? 0) > 0 ? (
                  <span className="text-orange-600 font-semibold">{pendingEventsCount} pending review</span>
                ) : (
                  <span>Published on explore</span>
                )}
              </div>
            </div>

            {/* Tickets Sold */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tickets Sold</span>
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-orange-400">
                  <Ticket className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
                {(totalTickets ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">Confirmed attendee passes</div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Events Pending Review Queue */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Events Pending Review</h2>
                    {(pendingEventsCount ?? 0) > 0 && (
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 text-xs font-bold rounded-full">
                        {pendingEventsCount}
                      </span>
                    )}
                  </div>
                  <Link href="/admin/dashboard/events" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                    View All Events →
                  </Link>
                </div>

                {pendingEventsList && pendingEventsList.length > 0 ? (
                  <div className="space-y-3">
                    {pendingEventsList.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 transition-all">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                            {event.title?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">{event.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              by {event.organisers?.org_name || 'Organiser'} · {event.city} · {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            href={`/admin/dashboard/events/${event.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </Link>
                          <AdminApproveEventButton
                            eventId={event.id}
                            eventTitle={event.title}
                            organiserId={event.organiser_id}
                            organiserName={event.organisers?.org_name}
                            isHostVerified={event.organisers?.is_verified}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
                          />
                          <form action={`/api/admin/events/${event.id}/reject`} method="POST" className="inline">
                            <button
                              type="submit"
                              className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">All caught up</p>
                    <p className="text-xs text-slate-400 mt-0.5">No events currently pending moderation review.</p>
                  </div>
                )}
              </div>

              {/* Organiser KYC Verification Queue */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Organisers Awaiting KYC</h2>
                    {(pendingOrganisersCount ?? 0) > 0 && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
                        {pendingOrganisersCount}
                      </span>
                    )}
                  </div>
                  <Link href="/admin/dashboard/organisers" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                    Manage All Organisers →
                  </Link>
                </div>

                {pendingOrganisersList && pendingOrganisersList.length > 0 ? (
                  <div className="space-y-3">
                    {pendingOrganisersList.map((org) => (
                      <div key={org.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {org.org_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">{org.org_name}</div>
                            <div className="text-xs text-slate-500">
                              Contact: {org.contact_name} ({org.email})
                            </div>
                          </div>
                        </div>
                        <form action={`/api/admin/organisers/${org.id}/verify`} method="POST" className="inline">
                          <button
                            type="submit"
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Verify Host
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">All Hosts Verified</p>
                    <p className="text-xs text-slate-400 mt-0.5">No organizer accounts pending KYC approval.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column (Sidebar Widgets) */}
            <div className="space-y-6">

              {/* Quick Actions */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
                <div className="space-y-1">
                  {[
                    { icon: Calendar, label: 'Review pending events', href: '/admin/dashboard/events', badge: pendingEventsCount ?? 0 },
                    { icon: UserCheck, label: 'Manage organisers', href: '/admin/dashboard/organisers', badge: pendingOrganisersCount ?? 0 },
                    { icon: Users, label: 'Manage users', href: '/admin/dashboard/users' },
                    { icon: Megaphone, label: 'Send announcement', href: '/admin/dashboard/announcements' },
                    { icon: Shield, label: 'Trust scores', href: '/admin/dashboard/trust' },
                    { icon: Search, label: 'AI event scanner', href: '/admin/dashboard/scanner' },
                  ].map(({ icon: Icon, label, href, badge }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50 text-slate-700 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 group-hover:text-orange-600 group-hover:bg-orange-50 transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold flex-1">{label}</span>
                      {badge && badge > 0 ? (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">{badge}</span>
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Platform Health */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Platform Health</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Events pending review', value: pendingEventsCount ?? 0, warn: (pendingEventsCount ?? 0) > 0 },
                    { label: 'Organisers pending KYC', value: pendingOrganisersCount ?? 0, warn: (pendingOrganisersCount ?? 0) > 0 },
                    { label: 'Live active events', value: liveEventsCount ?? 0, warn: false },
                    { label: 'Total registered users', value: totalUsers ?? 0, warn: false },
                  ].map(({ label, value, warn }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${warn ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                        <span className="text-xs text-slate-600">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Super Admin Access */}
              {isSuperAdmin && (
                <Link
                  href="/admin/dashboard/settings"
                  className="block bg-slate-900 rounded-2xl p-5 hover:bg-slate-800 transition-colors text-white shadow-sm border border-slate-800"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-orange-400" />
                    <span className="text-sm font-extrabold">Team Governance</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Create administrative accounts, assign operational roles, and manage team access controls.
                  </p>
                </Link>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}