import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Ticket, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient.from('admin_team').select('department').eq('id', user.id).single()
  if (!admin || !['super_admin', 'support', 'operations'].includes(admin.department)) redirect('/admin/dashboard')

  const params = await searchParams
  const status = params.status || 'all'
  const page = parseInt(params.page || '1')
  const pageSize = 25
  const offset = (page - 1) * pageSize

  let query = adminClient
    .from('tickets')
    .select('*, users(username, email), events(title, event_date), ticket_types(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status !== 'all') query = query.eq('status', status)

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

  const statusConfig: Record<string, { color: string, icon: React.ElementType }> = {
    active: { color: 'bg-green-50 text-green-600', icon: CheckCircle },
    used: { color: 'bg-blue-50 text-blue-600', icon: CheckCircle },
    cancelled: { color: 'bg-red-50 text-red-500', icon: XCircle },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Tickets</span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">paddy<span className="text-orange-500">meet</span></Link>
      </nav>

      <div className="pt-16 max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Tickets</h1>
          <p className="text-sm text-gray-500">All tickets issued across the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Active', value: activeCount ?? 0, color: 'green', status: 'active' },
            { label: 'Used', value: usedCount ?? 0, color: 'blue', status: 'used' },
            { label: 'Cancelled', value: cancelledCount ?? 0, color: 'red', status: 'cancelled' },
            { label: 'Total issued', value: totalCount ?? 0, color: 'orange', status: 'all' },
          ].map(({ label, value, color, status: s }) => (
            <Link key={label} href={`/admin/dashboard/tickets?status=${s}`}
              className={`bg-white border-2 rounded-2xl p-4 md:p-5 transition-all hover:shadow-sm ${
                status === s
                  ? color === 'green' ? 'border-green-300' : color === 'blue' ? 'border-blue-300' : color === 'red' ? 'border-red-300' : 'border-orange-300'
                  : 'border-gray-100'
              }`}>
              <div className="text-xl md:text-2xl font-extrabold text-gray-900 mb-0.5">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </Link>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'active', 'used', 'cancelled'].map(s => (
            <Link key={s} href={`/admin/dashboard/tickets?status=${s}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize ${
                status === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {s}
            </Link>
          ))}
        </div>

        {/* Tickets table */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>Ticket Code</span>
            <span>User</span>
            <span>Event</span>
            <span>Ticket Type</span>
            <span>Status</span>
          </div>
          {tickets && tickets.length > 0 ? (
            tickets.map((ticket) => {
              const config = statusConfig[ticket.status] || statusConfig.active
              const StatusIcon = config.icon
              return (
                <div key={ticket.id} className="flex flex-col sm:grid sm:grid-cols-5 gap-2 sm:gap-4 px-4 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors items-start sm:items-center">
                  <div className="text-xs font-mono font-bold text-gray-900">{ticket.ticket_code}</div>
                  <div className="text-sm text-gray-700 truncate">{ticket.users?.username || '—'}</div>
                  <div className="text-xs text-gray-500 truncate">{ticket.events?.title || '—'}</div>
                  <div className="text-xs text-gray-500">{ticket.ticket_types?.name || '—'}</div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${config.color}`}>
                      <StatusIcon className="w-3 h-3" /> {ticket.status}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-10">
              <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tickets found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {page > 1 && (
              <Link href={`/admin/dashboard/tickets?status=${status}&page=${page - 1}`}
                className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:border-gray-300 transition-colors">
                Previous
              </Link>
            )}
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link href={`/admin/dashboard/tickets?status=${status}&page=${page + 1}`}
                className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:border-gray-300 transition-colors">
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}