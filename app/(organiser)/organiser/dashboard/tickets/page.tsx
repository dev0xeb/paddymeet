import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OrganiserNav from '@/components/OrganiserNav'
import {
  Ticket, Calendar,
  TrendingUp, DollarSign, Users, ChevronLeft, ChevronRight
} from 'lucide-react'

interface Order {
  id: string
  total_paid: number
  service_fee: number
  payment_status: string
  created_at: string
  event_id: string
  events: { title: string } | { title: string }[] | null
}

function getEventTitle(events: Order['events']): string {
  if (!events) return 'Unknown Event'
  if (Array.isArray(events)) return events[0]?.title || 'Unknown Event'
  return events.title || 'Unknown Event'
}

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

  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date')
    .eq('organiser_id', user.id)
    .order('event_date', { ascending: false })

  const eventIds = events?.map(e => e.id) || []

  if (eventIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
      <OrganiserNav orgName={organiser?.org_name || ''} />
        <div className="pt-24 md:pt-16 max-w-5xl mx-auto px-4 md:px-6 py-8 text-center">
          <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-4 mt-20" />
          <h2 className="text-lg font-bold text-gray-700 mb-2">No events yet</h2>
          <p className="text-sm text-gray-400 mb-5">Submit your first event to start selling tickets</p>
          <Link href="/organiser/dashboard/events/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors">
            Submit New Event
          </Link>
        </div>
      </div>
    )
  }

  let ordersQuery = supabase
    .from('orders')
    .select('id, total_paid, service_fee, payment_status, created_at, event_id, events(title)', { count: 'exact' })
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (params.event_id) {
    ordersQuery = ordersQuery.eq('event_id', params.event_id)
  }

  const { data: rawOrders, count } = await ordersQuery
  const orders = rawOrders as unknown as Order[]
  const totalPages = Math.ceil((count || 0) / pageSize)

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
      <OrganiserNav orgName={organiser?.org_name || ''} />
      <div className="pt-24 md:pt-16 max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Ticket Sales</h1>
          <p className="text-sm text-gray-500">Track all ticket purchases across your events</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Tickets sold', value: (totalTickets ?? 0).toLocaleString(), icon: Ticket, color: 'blue' },
            { label: 'Gross revenue', value: `₦${(totalRevenue / 1000).toFixed(1)}k`, icon: DollarSign, color: 'green' },
            { label: 'Net revenue', value: `₦${(netRevenue / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'orange' },
            { label: 'Total orders', value: (allOrders?.length ?? 0).toLocaleString(), icon: Users, color: 'purple' },
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
        <div className="flex gap-2 flex-wrap mb-6">
          <Link href="/organiser/dashboard/tickets"
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              !params.event_id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            All Events
          </Link>
          {events?.slice(0, 5).map(event => (
            <Link key={event.id}
              href={`/organiser/dashboard/tickets?event_id=${event.id}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                params.event_id === event.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {event.title}
            </Link>
          ))}
        </div>

        {/* Orders table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
            {['Event', 'Date', 'Amount', 'Service Fee', 'Status'].map(h => (
              <div key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>

          {orders && orders.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {orders.map((order) => {
                const eventTitle = getEventTitle(order.events)
                return (
                  <div key={order.id} className="grid grid-cols-5 gap-4 px-5 py-4 hover:bg-gray-50 transition-colors items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {eventTitle.charAt(0)}
                      </div>
                      <div className="text-xs font-bold text-gray-900 truncate">{eventTitle}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-sm font-bold text-green-600">
                      ₦{order.total_paid?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      ₦{order.service_fee?.toLocaleString() || '0'}
                    </div>
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
                )
              })}
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