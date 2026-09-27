import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Calendar, Ticket, Shield, CheckCircle, XCircle,
  AlertCircle, Eye, ChevronRight, UserCheck, ShieldCheck, Megaphone, Search
} from 'lucide-react'
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

  return (
    <div className="p-4 sm:p-6 md:p-8">

          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-3 mb-7">
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
    </div>
  )
}