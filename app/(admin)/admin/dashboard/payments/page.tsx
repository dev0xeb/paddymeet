import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, DollarSign, CreditCard, TrendingUp, Receipt, Filter,
  Calendar, CheckCircle, AlertCircle, Clock
} from 'lucide-react'
import AdminFinancialExportModal from '@/components/AdminFinancialExportModal'

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
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

  if (!admin || !['super_admin', 'finance'].includes(admin.department)) {
    redirect('/admin/dashboard')
  }

  const params = await searchParams
  const status = params.status || 'all'
  const page = parseInt(params.page || '1')
  const pageSize = 25
  const offset = (page - 1) * pageSize

  let query = adminClient
    .from('orders')
    .select('*, users(username, email), events(title, city)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('payment_status', status)
  }

  const [
    { data: orders, count },
    { data: allOrders },
    { data: eventsList }
  ] = await Promise.all([
    query.range(offset, offset + pageSize - 1),
    adminClient.from('orders').select('total_paid, service_fee, payment_status'),
    adminClient.from('events').select('id, title').order('title')
  ])

  const totalRevenue = allOrders?.filter(o => o.payment_status === 'completed').reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0
  const totalFees = allOrders?.filter(o => o.payment_status === 'completed').reduce((sum, o) => sum + (o.service_fee || 0), 0) || 0
  const totalOrders = allOrders?.filter(o => o.payment_status === 'completed').length || 0
  const failedOrders = allOrders?.filter(o => o.payment_status === 'failed').length || 0

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Payment Records
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header & Export Action */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Financial Transactions</h1>
            <p className="text-xs text-slate-500">Real-time payment logs, processing fees, and order receipts across the platform.</p>
          </div>
          <AdminFinancialExportModal events={eventsList || []} />
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Gross Volume', value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'emerald' },
            { label: 'Platform Fees Collected', value: `₦${totalFees.toLocaleString()}`, icon: Receipt, color: 'blue' },
            { label: 'Completed Orders', value: totalOrders.toString(), icon: CreditCard, color: 'orange' },
            { label: 'Failed Payments', value: failedOrders.toString(), icon: TrendingUp, color: 'rose' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">{value}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {[
            { label: 'All Transactions', val: 'all' },
            { label: 'Completed', val: 'completed' },
            { label: 'Pending', val: 'pending' },
            { label: 'Failed', val: 'failed' },
          ].map(({ label, val }) => (
            <Link
              key={val}
              href={`/admin/dashboard/payments?status=${val}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                status === val
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Payments Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer / Buyer</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Platform Fee</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders && orders.length > 0 ? (
                  orders.map((order) => {
                    const isCompleted = order.payment_status === 'completed'
                    const isPending = order.payment_status === 'pending'
                    const displayName = order.buyer_name || order.users?.username || 'Customer'

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{displayName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[170px]">{order.users?.email || order.buyer_phone || '—'}</div>
                        </td>

                        {/* Event */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                            {order.events?.title || 'Event ticket'}
                          </div>
                          {order.events?.city && (
                            <div className="text-[10px] text-slate-400">{order.events.city}</div>
                          )}
                        </td>

                        {/* Reference */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {order.payment_reference}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                          ₦{(order.total_paid || 0).toLocaleString()}
                        </td>

                        {/* Platform Fee */}
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          ₦{(order.service_fee || 0).toLocaleString()}
                        </td>

                        {/* Method */}
                        <td className="py-3.5 px-4 text-slate-600 capitalize whitespace-nowrap">
                          {order.payment_method || 'Paystack'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            isPending ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isCompleted && <CheckCircle className="w-3 h-3" />}
                            {isPending && <Clock className="w-3 h-3" />}
                            {!isCompleted && !isPending && <AlertCircle className="w-3 h-3" />}
                            {order.payment_status || 'completed'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No transactions found</p>
                      <p className="text-xs text-slate-400 mt-0.5">No orders recorded under this filter criteria.</p>
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
              Showing page {page} of {totalPages} ({count} total transactions)
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/dashboard/payments?status=${status}&page=${page - 1}`}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/dashboard/payments?status=${status}&page=${page + 1}`}
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