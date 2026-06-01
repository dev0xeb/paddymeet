import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, DollarSign, TrendingUp, Ticket,
  Calendar, ChevronLeft, ChevronRight, ArrowUpRight
} from 'lucide-react'

export default async function OrganiserRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
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
    .select('id, title, event_date, is_live, is_approved')
    .eq('organiser_id', user.id)

  const eventIds = events?.map(e => e.id) || []

  const { data: allOrders } = await supabase
    .from('orders')
    .select('id, total_paid, service_fee, created_at, event_id')
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })

  const { data: pagedOrders, count } = await supabase
    .from('orders')
    .select('id, total_paid, service_fee, created_at, event_id, events(title)', { count: 'exact' })
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  const totalPages = Math.ceil((count || 0) / pageSize)

  const grossRevenue = allOrders?.reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0
  const totalFees = allOrders?.reduce((sum, o) => sum + (o.service_fee || 0), 0) || 0
  const paddymeetCommission = grossRevenue * 0.1
  const netRevenue = grossRevenue - totalFees - paddymeetCommission

  // Revenue by event
  const revenueByEvent = events?.map(event => {
    const eventOrders = allOrders?.filter(o => o.event_id === event.id) || []
    const revenue = eventOrders.reduce((sum, o) => sum + (o.total_paid || 0), 0)
    const fees = eventOrders.reduce((sum, o) => sum + (o.service_fee || 0), 0)
    return {
      ...event,
      revenue,
      fees,
      net: revenue - fees - revenue * 0.1,
      orders: eventOrders.length,
    }
  }).sort((a, b) => b.revenue - a.revenue) || []

  // Monthly breakdown
  const monthlyData: Record<string, number> = {}
  allOrders?.forEach(order => {
    const month = new Date(order.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    monthlyData[month] = (monthlyData[month] || 0) + (order.total_paid || 0)
  })
  const months = Object.entries(monthlyData).slice(-6).reverse()

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/organiser/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Revenue
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <Link href="/organiser/dashboard/payouts"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors">
          View Payouts <ArrowUpRight className="w-4 h-4" />
        </Link>
      </nav>

      <div className="pt-16 max-w-5xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Revenue</h1>
          <p className="text-sm text-gray-500">Your earnings breakdown across all events</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Gross revenue', value: `₦${(grossRevenue / 1000).toFixed(1)}k`, icon: DollarSign, color: 'green', desc: 'Total ticket sales' },
            { label: 'Service fees', value: `₦${(totalFees / 1000).toFixed(1)}k`, icon: Ticket, color: 'orange', desc: 'Paystack charges' },
            { label: 'Commission', value: `₦${(paddymeetCommission / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'purple', desc: '10% Paddymeet fee' },
            { label: 'Net revenue', value: `₦${(netRevenue / 1000).toFixed(1)}k`, icon: DollarSign, color: 'blue', desc: 'Your actual earnings' },
          ].map(({ label, value, icon: Icon, color, desc }) => (
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
              <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">

          {/* Revenue by event */}
          <div className="col-span-2 bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-sm font-extrabold text-gray-900 mb-4">Revenue by Event</h2>
            {revenueByEvent.length > 0 ? (
              <div className="space-y-3">
                {revenueByEvent.map(event => {
                  const pct = grossRevenue > 0 ? (event.revenue / grossRevenue) * 100 : 0
                  return (
                    <div key={event.id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">{event.title}</div>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                            event.is_live ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {event.is_live ? 'Live' : 'Ended'}
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-gray-900 flex-shrink-0 ml-2">
                          ₦{event.revenue.toLocaleString()}
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{event.orders} orders</span>
                        <span>Net: ₦{event.net.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No revenue data yet</p>
              </div>
            )}
          </div>

          {/* Monthly breakdown */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-sm font-extrabold text-gray-900 mb-4">Monthly Breakdown</h2>
            {months.length > 0 ? (
              <div className="space-y-3">
                {months.map(([month, amount]) => {
                  const maxAmount = Math.max(...months.map(([, a]) => a))
                  const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
                  return (
                    <div key={month}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{month}</span>
                        <span className="font-bold text-gray-900">₦{(amount / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No data yet</p>
              </div>
            )}

            {/* Fee breakdown */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Fee Breakdown</div>
              <div className="space-y-2">
                {[
                  { label: 'Gross revenue', value: `₦${(grossRevenue / 1000).toFixed(1)}k`, color: 'text-gray-900' },
                  { label: 'Service fees', value: `-₦${(totalFees / 1000).toFixed(1)}k`, color: 'text-red-500' },
                  { label: 'Paddymeet (10%)', value: `-₦${(paddymeetCommission / 1000).toFixed(1)}k`, color: 'text-red-500' },
                  { label: 'Net earnings', value: `₦${(netRevenue / 1000).toFixed(1)}k`, color: 'text-green-600 font-extrabold' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{label}</span>
                    <span className={color}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-gray-900">Transaction History</h2>
            <span className="text-xs text-gray-400">{count} total</span>
          </div>

          <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
            {['Event', 'Date', 'Gross', 'Net'].map(h => (
              <div key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>

          {pagedOrders && pagedOrders.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {pagedOrders.map((order) => {
                const evTitle = Array.isArray(order.events)
                  ? order.events[0]?.title
                  : (order.events as { title: string } | null)?.title
                const net = (order.total_paid || 0) - (order.service_fee || 0) - (order.total_paid || 0) * 0.1
                return (
                  <div key={order.id} className="grid grid-cols-4 gap-4 px-5 py-4 hover:bg-gray-50 transition-colors items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {evTitle?.charAt(0) || 'E'}
                      </div>
                      <div className="text-xs font-bold text-gray-900 truncate">{evTitle || '—'}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-sm font-bold text-gray-900">₦{order.total_paid?.toLocaleString()}</div>
                    <div className="text-sm font-bold text-green-600">₦{Math.round(net).toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No transactions yet</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500">
              Showing {offset + 1}–{Math.min(offset + pageSize, count || 0)} of {count?.toLocaleString()} transactions
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/organiser/dashboard/revenue?page=${page - 1}`}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <Link key={pageNum} href={`/organiser/dashboard/revenue?page=${pageNum}`}
                    className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors flex items-center justify-center ${
                      pageNum === page ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {pageNum}
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link href={`/organiser/dashboard/revenue?page=${page + 1}`}
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