import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Ticket, Calendar, Search,
  TrendingUp, DollarSign, Users, ChevronLeft, ChevronRight
} from 'lucide-react'

export default async function OrganiserTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string, event_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id, org_name')
    .eq('id', user.id)
    .single()
  if (!organiser) redirect('/login')

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const pageSize = 20
  const offset = (page - 1) * pageSize

  // Get all organiser events
  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date')
    .eq('organiser_id', user.id)
    .order('event_date', { ascending: false })

  const eventIds = events?.map(e => e.id) || []

  // Get orders with tickets
  let ordersQuery = supabase
    .from('orders')
    .select('*, events(title, event_date)', { count: 'exact' })
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (params.event_id) {
    ordersQuery = ordersQuery.eq('event_id', params.event_id)
  }

  const { data: orders, count } = await ordersQuery
  const totalPages = Math.ceil((count || 0) / pageSize)

  // Summary stats
  const { data: allOrders } = await supabase
    .from('orders')
    .select('total_paid, service_fee')
    .in('event_id', eventIds)

  const totalRevenue = allOrders?.reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0
  const totalServiceFees = allOrders?.reduce((sum, o) => sum + (o.service_fee || 0), 0) || 0
  const netRevenue = totalRevenue - totalServiceFees

  const { count: totalTickets } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('event_id', eventIds)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/organiser/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Ticket Sales
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="w-24" />
      </nav>

      <div className="pt-16 max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Ticket Sales</h1>
          <p className="text-sm text-gray-500">Track all ticket purchases across your events</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tickets sold', value: (totalTickets ?? 0).toLocaleString(), icon: Ticket, color: 'blue' },
            { label: 'Gross revenue', value: `₦${(totalRevenue/1000).toFixed(1)}k`, icon: DollarSign, color: 'green' },
            { label: 'Net revenue', value: `₦${(netRevenue/1000).toFixed(1)}k`, icon: TrendingUp, color: 'orange' },
            { label: 'Total orders', value: (count ?? 0).toLocaleString(), icon: Users, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5">
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
              <div className="text-2xl font-extrabold text-gray-900 tracking-tight mb-0.5">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Filter by event */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full">
            <Search className="w-4 h-4 text-gray-400" />
            <select
              defaultValue={params.event_id || ''}
              onChange={e => {
                const url = e.target.value
                  ? `/organiser/dashboard/tickets?event_id=${e.target.value}`
                  : '/organiser/dashboard/tickets'
                window.location.href = url
              }}
              className="bg-transparent border-none outline-none text-sm text-gray-700 cursor-pointer"
            >
              <option value="">All events</option>
              {events?.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>

          {params.event_id && (
            <Link href="/organiser/dashboard/tickets"
              className="text-sm font-bold text-orange-500 hover:underline">
              Clear filter
            </Link>
          )}
        </div>

        {/* Orders table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
            {['Event', 'Date', 'Amount', 'Service Fee', 'Status'].map(h => (
              <div key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>

          {orders && orders.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {orders.map((order) => (
                <div key={order.id} className="grid grid-cols-5 gap-4 px-5 py-4 hover:bg-gray-50 transition-colors items-center">

                  {/* Event */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {order.events?.title?.charAt(0) || 'E'}
                    </div>
                    <div className="text-xs font-bold text-gray-900 truncate">
                      {order.events?.title}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>

                  {/* Amount */}
                  <div className="text-sm font-bold text-green-600">
                    ₦{order.total_paid?.toLocaleString()}
                  </div>

                  {/* Service fee */}
                  <div className="text-xs text-gray-500">
                    ₦{order.service_fee?.toLocaleString() || '0'}
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                      order.payment_status === 'completed'
                        ? 'bg-green-50 text-green-600 border-green-200'
                        : order.payment_status === 'pending'
                        ? 'bg-orange-50 text-orange-500 border-orange-200'
                        : 'bg-red-50 text-red-500 border-red-200'
                    }`}>
                      {order.payment_status || 'completed'}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400 mb-1">No sales yet</p>
              <p className="text-xs text-gray-400">Ticket purchases will appear here</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500">
              Showing {offset + 1}–{Math.min(offset + pageSize, count || 0)} of {count?.toLocaleString()} orders
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/organiser/dashboard/tickets?page=${page - 1}${params.event_id ? `&event_id=${params.event_id}` : ''}`}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <Link key={pageNum}
                    href={`/organiser/dashboard/tickets?page=${pageNum}${params.event_id ? `&event_id=${params.event_id}` : ''}`}
                    className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors flex items-center justify-center ${
                      pageNum === page ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {pageNum}
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link href={`/organiser/dashboard/tickets?page=${page + 1}${params.event_id ? `&event_id=${params.event_id}` : ''}`}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}