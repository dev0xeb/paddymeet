import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Ticket, CheckCircle, XCircle, Clock, Filter,
  Search, CheckCheck, Calendar, User, Phone, Mail
} from 'lucide-react'
import AdminTicketActions from '@/components/AdminTicketActions'

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()

  if (!admin || !['super_admin', 'support', 'operations'].includes(admin.department)) {
    redirect('/admin/dashboard')
  }

  const params = await searchParams
  const status = params.status || 'all'
  const search = params.search || ''
  const page = parseInt(params.page || '1')
  const pageSize = 20
  const offset = (page - 1) * pageSize

  let query = adminClient
    .from('tickets')
    .select('*, users(username, email, phone), events(title, event_date, city), ticket_types(name, price)', { count: 'exact' })
    .order('purchased_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`ticket_code.ilike.%${search}%,attendee_name.ilike.%${search}%,attendee_email.ilike.%${search}%`)
  }

  const { data: tickets, count } = await query.range(offset, offset + pageSize - 1)

  const [
    { count: activeCount },
    { count: usedCount },
    { count: cancelledCount },
    { count: totalCount },
  ] = await Promise.all([
    adminClient.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    adminClient.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'used'),
    adminClient.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    adminClient.from('tickets').select('*', { count: 'exact', head: true }),
  ])

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const statusConfig: Record<string, { label: string; color: string; border: string; icon: React.ElementType }> = {
    active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
    used: { label: 'Used / Attended', color: 'bg-blue-50 text-blue-700', border: 'border-blue-200', icon: CheckCheck },
    cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700', border: 'border-rose-200', icon: XCircle },
    refunded: { label: 'Refunded', color: 'bg-amber-50 text-amber-700', border: 'border-amber-200', icon: XCircle },
  }

  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Tickets Management
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Issued Tickets</h1>
            <p className="text-xs text-slate-500">Manage and monitor all attendee passes and check-in statuses across the platform.</p>
          </div>
          <form className="relative min-w-[280px]">
            <input type="hidden" name="status" value={status} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search code, name, or email..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </form>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Active Tickets', value: activeCount ?? 0, color: 'emerald', status: 'active' },
            { label: 'Checked In / Used', value: usedCount ?? 0, color: 'blue', status: 'used' },
            { label: 'Cancelled / Void', value: cancelledCount ?? 0, color: 'rose', status: 'cancelled' },
            { label: 'Total Issued', value: totalCount ?? 0, color: 'slate', status: 'all' },
          ].map(({ label, value, color, status: s }) => (
            <Link
              key={label}
              href={`/admin/dashboard/tickets?status=${s}${search ? `&search=${search}` : ''}`}
              className={`bg-white border rounded-2xl p-4 md:p-5 transition-all shadow-sm hover:shadow ${
                status === s
                  ? 'border-orange-500 ring-2 ring-orange-500/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                <div className={`w-2 h-2 rounded-full ${
                  color === 'emerald' ? 'bg-emerald-500' :
                  color === 'blue' ? 'bg-blue-500' :
                  color === 'rose' ? 'bg-rose-500' : 'bg-slate-900'
                }`} />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{value.toLocaleString()}</div>
            </Link>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {[
            { label: 'All Tickets', val: 'all', count: totalCount ?? 0 },
            { label: 'Active', val: 'active', count: activeCount ?? 0 },
            { label: 'Used', val: 'used', count: usedCount ?? 0 },
            { label: 'Cancelled', val: 'cancelled', count: cancelledCount ?? 0 },
          ].map(({ label, val, count: c }) => (
            <Link
              key={val}
              href={`/admin/dashboard/tickets?status=${val}${search ? `&search=${search}` : ''}`}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                status === val
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span>{label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                status === val ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {c}
              </span>
            </Link>
          ))}
        </div>

        {/* Tickets Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket Code</th>
                  <th className="py-3 px-4">Attendee</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Ticket Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Purchased</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tickets && tickets.length > 0 ? (
                  tickets.map((ticket) => {
                    const config = statusConfig[ticket.status] || statusConfig.active
                    const StatusIcon = config.icon
                    const displayName = ticket.attendee_name || ticket.users?.username || 'Attendee'
                    const displayEmail = ticket.attendee_email || ticket.users?.email || ''
                    const displayPhone = ticket.attendee_phone || ticket.users?.phone || ''

                    return (
                      <tr key={ticket.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Ticket Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-800 border border-slate-200/60">
                            {ticket.ticket_code}
                          </span>
                        </td>

                        {/* Attendee */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{displayName}</div>
                          {displayEmail && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{displayEmail}</div>
                          )}
                          {displayPhone && (
                            <div className="text-[10px] text-slate-400">{displayPhone}</div>
                          )}
                        </td>

                        {/* Event */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                            {ticket.events?.title || 'Event'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {ticket.events?.event_date
                              ? new Date(ticket.events.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                              : 'TBC'}
                            {ticket.events?.city ? ` · ${ticket.events.city}` : ''}
                          </div>
                        </td>

                        {/* Ticket Tier */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            {ticket.ticket_types?.name || 'Standard Pass'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.color} ${config.border}`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </td>

                        {/* Purchased Timestamp */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {ticket.purchased_at
                            ? new Date(ticket.purchased_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <AdminTicketActions
                            ticketId={ticket.id}
                            ticketCode={ticket.ticket_code}
                            currentStatus={ticket.status}
                          />
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No tickets found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {search ? 'Try adjusting your search criteria' : 'No tickets match the selected status filter.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-xs">
            <span className="text-slate-500 font-medium">
              Showing page {page} of {totalPages} ({count} total tickets)
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/dashboard/tickets?status=${status}&page=${page - 1}${search ? `&search=${search}` : ''}`}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/dashboard/tickets?status=${status}&page=${page + 1}${search ? `&search=${search}` : ''}`}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}