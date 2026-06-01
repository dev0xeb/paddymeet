import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, XCircle, Calendar,
  Mail, Phone, Globe, Ticket, DollarSign,
  Building2, User, MapPin, Clock
} from 'lucide-react'

export default async function AdminOrganiserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()
  if (!admin) redirect('/admin-login')

  const { data: organiser } = await adminClient
    .from('organisers')
    .select('*, organiser_event_types(*)')
    .eq('id', id)
    .single()

  if (!organiser) notFound()

  const { data: events } = await adminClient
    .from('events')
    .select('*')
    .eq('organiser_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: orders } = await adminClient
    .from('orders')
    .select('*, events(title)')
    .in('event_id', events?.map(e => e.id) || [])
    .order('created_at', { ascending: false })
    .limit(10)

  const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0
  const totalTickets = orders?.length || 0
  const liveEvents = events?.filter(e => e.is_approved && e.is_live).length || 0
  const pendingEvents = events?.filter(e => !e.is_approved).length || 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/organisers" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Organisers
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Organiser Detail
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">

          {/* Left — profile */}
          <div className="space-y-5">

            {/* Organiser card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-extrabold text-xl flex-shrink-0">
                  {organiser.org_name?.charAt(0) || 'O'}
                </div>
                <div>
                  <div className="font-extrabold text-gray-900">{organiser.org_name}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      organiser.is_verified
                        ? 'bg-green-50 text-green-600 border-green-200'
                        : 'bg-orange-50 text-orange-500 border-orange-200'
                    }`}>
                      {organiser.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                    {!organiser.is_active && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-500 border border-red-200 rounded-full text-xs font-bold">
                        Suspended
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {organiser.contact_name}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {organiser.email}
                </div>
                {organiser.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {organiser.phone}
                  </div>
                )}
                {organiser.website && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <a href={organiser.website} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 hover:underline truncate">
                      {organiser.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Joined {organiser.created_at ? new Date(organiser.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl mb-5">
                {[
                  { label: 'Live Events', value: liveEvents },
                  { label: 'Pending', value: pendingEvents },
                  { label: 'Tickets Sold', value: totalTickets },
                  { label: 'Revenue', value: `₦${(totalRevenue/1000).toFixed(0)}k` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-2">
                    <div className="text-base font-extrabold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              {/* Event types */}
              {organiser.organiser_event_types && organiser.organiser_event_types.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Types</div>
                  <div className="flex flex-wrap gap-1.5">
                    {organiser.organiser_event_types.map((t: { event_type: string }) => (
                      <span key={t.event_type} className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                        {t.event_type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {organiser.description && (
                <div className="mb-5">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</div>
                  <p className="text-xs text-gray-600 leading-relaxed">{organiser.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Actions</div>

                {!organiser.is_verified && (
                  <form action={`/api/admin/organisers/${id}/verify`} method="POST">
                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Verify Organiser
                    </button>
                  </form>
                )}

                {organiser.is_active && organiser.is_verified && (
                  <form action={`/api/admin/organisers/${id}/suspend`} method="POST">
                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold rounded-xl hover:bg-orange-100 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Suspend Account
                    </button>
                  </form>
                )}

                {!organiser.is_active && (
                  <form action={`/api/admin/organisers/${id}/restore`} method="POST">
                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Restore Account
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>

          {/* Right — events and transactions */}
          <div className="col-span-2 space-y-5">

            {/* Events */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-extrabold text-gray-900">Events</h2>
                <span className="text-xs text-gray-400">({events?.length || 0} total)</span>
              </div>
              {events && events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {event.title?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate">{event.title}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {event.city} · {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 border ${
                        event.is_approved && event.is_live
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : !event.is_approved
                          ? 'bg-orange-50 text-orange-500 border-orange-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {event.is_approved && event.is_live ? 'Live' : !event.is_approved ? 'Pending' : 'Approved'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No events submitted yet</p>
                </div>
              )}
            </div>

            {/* Recent transactions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-green-500" />
                <h2 className="text-sm font-extrabold text-gray-900">Recent Transactions</h2>
                <span className="text-xs text-gray-400">(Total: ₦{totalRevenue.toLocaleString()})</span>
              </div>
              {orders && orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Ticket className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate">{order.events?.title}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-green-600 flex-shrink-0">
                        +₦{order.total_paid?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No transactions yet</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}