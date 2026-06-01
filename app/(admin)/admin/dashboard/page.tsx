import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Calendar, Ticket, DollarSign, Shield, Bell,
  Settings, LogOut, BarChart2, Flag, CheckCircle, XCircle, AlertCircle, TrendingUp, Eye, ChevronRight,
  Megaphone, Search, UserCheck, Database
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if user is an admin
  const { data: admin } = await supabase
    .from('admin_team')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!admin) redirect('/')

  // Fetch stats
  const [
    { count: totalUsers },
    { count: totalOrganisers },
    { count: totalEvents },
    { count: pendingEvents },
    { count: totalTickets },
    { data: recentUsers },
    { data: pendingEventsList },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('organisers').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('tickets').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('id, username, city, state, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('events').select('*, organisers(org_name)').eq('is_approved', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('orders').select('*, events(title)').order('created_at', { ascending: false }).limit(5),
  ])

  const totalRevenue = recentOrders?.reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0

  const isSuperAdmin = admin.role === 'super_admin'

  const navItems = [
    { icon: BarChart2, label: 'Overview', href: '/admin/dashboard', active: true, roles: ['super_admin', 'support', 'finance', 'marketing', 'operations'] },
    { icon: Users, label: 'Users', href: '/admin/dashboard/users', roles: ['super_admin', 'support', 'operations'] },
    { icon: UserCheck, label: 'Organisers', href: '/admin/dashboard/organisers', roles: ['super_admin', 'support', 'operations'] },
    { icon: Calendar, label: 'Events', href: '/admin/dashboard/events', roles: ['super_admin', 'support', 'marketing', 'operations'] },
    { icon: Ticket, label: 'Tickets', href: '/admin/dashboard/tickets', roles: ['super_admin', 'support', 'operations'] },
    { icon: DollarSign, label: 'Payments', href: '/admin/dashboard/payments', roles: ['super_admin', 'finance'] },
    { icon: TrendingUp, label: 'Revenue', href: '/admin/dashboard/revenue', roles: ['super_admin', 'finance'] },
    { icon: Megaphone, label: 'Announcements', href: '/admin/dashboard/announcements', roles: ['super_admin', 'marketing'] },
    { icon: Search, label: 'AI Scanner', href: '/admin/dashboard/scanner', roles: ['super_admin', 'marketing'] },
    { icon: Flag, label: 'Reports', href: '/admin/dashboard/reports', roles: ['super_admin', 'support'] },
    { icon: Shield, label: 'Trust Scores', href: '/admin/dashboard/trust', roles: ['super_admin', 'support'] },
    { icon: Database, label: 'Support Tickets', href: '/admin/dashboard/support', roles: ['super_admin', 'support'] },
  ]

  const visibleNavItems = navItems.filter(item => item.roles.includes(admin.role))

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-white tracking-tight">
            paddy<span className="text-orange-500">meet</span>
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Admin Dashboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:border-gray-600 transition-colors relative">
            <Bell className="w-4 h-4" />
            {(pendingEvents ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {pendingEvents}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
              {admin.name?.charAt(0) || 'A'}
            </div>
            <div>
              <span className="text-sm font-semibold text-white">{admin.name || 'Admin'}</span>
              <span className="ml-2 text-xs text-gray-400">{admin.role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">

        {/* Sidebar */}
        <aside className="w-56 fixed top-16 left-0 bottom-0 bg-gray-900 border-r border-gray-800 flex flex-col py-5 px-3">
          <div className="space-y-0.5 flex-1">
            {visibleNavItems.map(({ icon: Icon, label, href, active }) => (
              <Link key={label} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-3 space-y-0.5">
            {isSuperAdmin && (
              <Link href="/admin/dashboard/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                <Settings className="w-4 h-4" /> Settings & Team
              </Link>
            )}
            <form action="/auth/signout" method="POST">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </form>
          </div>

          {/* Admin badge */}
          <div className="mt-4 p-3 bg-gray-800 rounded-xl border border-gray-700">
            <div className="text-xs font-bold text-gray-300 truncate">{admin.name || 'Admin User'}</div>
            <div className="text-xs text-orange-400 font-semibold mt-0.5 capitalize">
              {admin.role?.replace('_', ' ') || 'Admin'}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-56 flex-1 p-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-7">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
                Command Centre
              </h1>
              <p className="text-sm text-gray-500">Welcome back, {admin.name?.split(' ')[0] || 'Admin'}</p>
            </div>
            <div className="flex items-center gap-3">
              {(pendingEvents ?? 0) > 0 && (
                <Link href="/admin/dashboard/events"
                  className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 text-orange-600 text-sm font-bold rounded-xl hover:bg-orange-100 transition-colors">
                  <AlertCircle className="w-4 h-4" />
                  {pendingEvents} events pending review
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
            {[
              { label: 'Total users', value: (totalUsers ?? 0).toLocaleString(), icon: Users, color: 'blue', change: 'All time' },
              { label: 'Organisers', value: (totalOrganisers ?? 0).toLocaleString(), icon: UserCheck, color: 'purple', change: 'Registered' },
              { label: 'Live events', value: (totalEvents ?? 0).toLocaleString(), icon: Calendar, color: 'green', change: 'Approved' },
              { label: 'Tickets sold', value: (totalTickets ?? 0).toLocaleString(), icon: Ticket, color: 'orange', change: 'All time' },
            ].map(({ label, value, icon: Icon, color, change }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
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
                  <span className="text-xs text-gray-400">{change}</span>
                </div>
                <div className="text-2xl font-extrabold text-gray-900 tracking-tight mb-0.5">{value}</div>
                <div className="text-xs text-gray-500 font-medium">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">

            {/* Left — 2 cols */}
            <div className="col-span-2 space-y-5">

              {/* Pending events review */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-gray-900">Events Pending Review</h2>
                    {(pendingEvents ?? 0) > 0 && (
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-500 border border-orange-200 text-xs font-bold rounded-full">
                        {pendingEvents}
                      </span>
                    )}
                  </div>
                  <Link href="/admin/dashboard/events" className="text-xs font-bold text-orange-500 hover:underline">View all →</Link>
                </div>

                {pendingEventsList && pendingEventsList.length > 0 ? (
                  <div className="space-y-3">
                    {pendingEventsList.map((event) => (
                      <div key={event.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0 flex items-center justify-center text-white font-bold">
                          {event.title?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{event.title}</div>
                          <div className="text-xs text-gray-500">
                            by {event.organisers?.org_name} · {event.city} · {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/admin/dashboard/events/${event.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                            <Eye className="w-3 h-3" /> Review
                          </Link>
                          <ApproveRejectButtons eventId={event.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-400">All caught up — no events pending review</p>
                  </div>
                )}
              </div>

              {/* Recent transactions */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-extrabold text-gray-900">Recent Transactions</h2>
                  <Link href="/admin/dashboard/payments" className="text-xs font-bold text-orange-500 hover:underline">View all →</Link>
                </div>
                {recentOrders && recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">{order.events?.title || 'Event ticket'}</div>
                          <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <div className="text-sm font-bold text-green-600 flex-shrink-0">+₦{order.total_paid?.toLocaleString()}</div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Showing last 5 transactions</span>
                      <span className="text-xs font-bold text-gray-900">Total: ₦{totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">No transactions yet</p>
                  </div>
                )}
              </div>

              {/* Recent users */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-extrabold text-gray-900">Recent Sign Ups</h2>
                  <Link href="/admin/dashboard/users" className="text-xs font-bold text-orange-500 hover:underline">View all →</Link>
                </div>
                {recentUsers && recentUsers.length > 0 ? (
                  <div className="space-y-3">
                    {recentUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.username?.replace('@', '').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900">{u.username}</div>
                          <div className="text-xs text-gray-500">{u.city}{u.state ? `, ${u.state}` : ''}</div>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">No users yet</p>
                  </div>
                )}
              </div>

            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* Quick actions */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h2 className="text-sm font-extrabold text-gray-900 mb-3">Quick Actions</h2>
                <div className="space-y-1">
                  {[
                    { icon: Calendar, label: 'Review pending events', href: '/admin/dashboard/events', badge: pendingEvents ?? 0 },
                    { icon: Users, label: 'Manage users', href: '/admin/dashboard/users' },
                    { icon: UserCheck, label: 'Manage organisers', href: '/admin/dashboard/organisers' },
                    { icon: Megaphone, label: 'Send announcement', href: '/admin/dashboard/announcements' },
                    { icon: Shield, label: 'Trust scores', href: '/admin/dashboard/trust' },
                    { icon: Search, label: 'AI event scanner', href: '/admin/dashboard/scanner' },
                  ].filter(item => {
                    if (!isSuperAdmin && item.href.includes('announcements')) return false
                    return true
                  }).map(({ icon: Icon, label, href, badge }) => (
                    <Link key={label} href={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-gray-50">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 flex-1">{label}</span>
                      {badge ? (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">{badge}</span>
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Platform health */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h2 className="text-sm font-extrabold text-gray-900 mb-4">Platform Health</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Events pending', value: pendingEvents ?? 0, status: (pendingEvents ?? 0) > 5 ? 'warn' : 'good' },
                    { label: 'Live events', value: totalEvents ?? 0, status: 'good' },
                    { label: 'Total users', value: totalUsers ?? 0, status: 'good' },
                    { label: 'Tickets issued', value: totalTickets ?? 0, status: 'good' },
                  ].map(({ label, value, status }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status === 'warn' ? 'bg-orange-400' : 'bg-green-400'}`} />
                        <span className="text-xs text-gray-600">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Super admin only — team management link */}
              {isSuperAdmin && (
                <Link href="/admin/dashboard/settings"
                  className="block bg-gray-900 rounded-2xl p-5 hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-orange-400" />
                    <span className="text-sm font-extrabold text-white">Team Management</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Create admin accounts, assign roles and manage team access.
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

// Client component for approve/reject buttons
function ApproveRejectButtons({ eventId }: { eventId: string }) {
  return (
    <div className="flex gap-1.5">
      <form action={`/api/admin/events/${eventId}/approve`} method="POST">
        <button
          type="submit"
          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors"
        >
          <CheckCircle className="w-3 h-3" /> Approve
        </button>
      </form>
      <form action={`/api/admin/events/${eventId}/reject`} method="POST">
        <button
          type="submit"
          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
        >
          <XCircle className="w-3 h-3" /> Reject
        </button>
      </form>
    </div>
  )
}