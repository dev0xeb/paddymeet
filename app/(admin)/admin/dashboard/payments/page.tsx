import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, CreditCard, TrendingUp, Receipt, Filter } from 'lucide-react'

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient.from('admin_team').select('department').eq('id', user.id).single()
  if (!admin || !['super_admin', 'finance'].includes(admin.department)) redirect('/admin/dashboard')

  const params = await searchParams
  const status = params.status || 'all'
  const page = parseInt(params.page || '1')
  const pageSize = 25
  const offset = (page - 1) * pageSize

  let query = adminClient
    .from('orders')
    .select('*, users(username, email), events(title)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status !== 'all') query = query.eq('payment_status', status)

  const { data: orders, count } = await query.range(offset, offset + pageSize - 1)

  const { data: allOrders } = await adminClient
    .from('orders')
    .select('total_paid, service_fee, payment_status')

  const totalRevenue = allOrders?.filter(o => o.payment_status === 'completed').reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0
  const totalFees = allOrders?.filter(o => o.payment_status === 'completed').reduce((sum, o) => sum + (o.service_fee || 0), 0) || 0
  const totalOrders = allOrders?.filter(o => o.payment_status === 'completed').length || 0
  const failedOrders = allOrders?.filter(o => o.payment_status === 'failed').length || 0

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Payments</span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">paddy<span className="text-orange-500">meet</span></Link>
      </nav>

      <div className="pt-16 max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Payments</h1>
          <p className="text-sm text-gray-500">All transactions processed across the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Total revenue', value: `₦${(totalRevenue/1000).toFixed(0)}k`, icon: DollarSign, color: 'green' },
            { label: 'Service fees collected', value: `₦${(totalFees/1000).toFixed(0)}k`, icon: Receipt, color: 'blue' },
            { label: 'Completed orders', value: totalOrders.toString(), icon: CreditCard, color: 'orange' },
            { label: 'Failed payments', value: failedOrders.toString(), icon: TrendingUp, color: 'red' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                color === 'green' ? 'bg-green-50' : color === 'blue' ? 'bg-blue-50' : color === 'orange' ? 'bg-orange-50' : 'bg-red-50'
              }`}>
                <Icon className={`w-4 h-4 ${
                  color === 'green' ? 'text-green-500' : color === 'blue' ? 'text-blue-500' : color === 'orange' ? 'text-orange-500' : 'text-red-500'
                }`} />
              </div>
              <div className="text-xl md:text-2xl font-extrabold text-gray-900 mb-0.5">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'completed', 'pending', 'failed'].map(s => (
            <Link key={s} href={`/admin/dashboard/payments?status=${s}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize ${
                status === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {s}
            </Link>
          ))}
        </div>

        {/* Transactions table */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-6 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>User</span>
            <span>Event</span>
            <span>Amount</span>
            <span>Fee</span>
            <span>Method</span>
            <span>Status</span>
          </div>
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="flex flex-col sm:grid sm:grid-cols-6 gap-2 sm:gap-4 px-4 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="text-sm font-bold text-gray-900 truncate">{order.users?.username || '—'}</div>
                <div className="text-xs text-gray-500 truncate">{order.events?.title || '—'}</div>
                <div className="text-sm font-bold text-gray-900">₦{(order.total_paid || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500">₦{(order.service_fee || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500 capitalize">{order.payment_method || '—'}</div>
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    order.payment_status === 'completed' ? 'bg-green-50 text-green-600' :
                    order.payment_status === 'pending' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'
                  }`}>{order.payment_status}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400">No transactions found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {page > 1 && (
              <Link href={`/admin/dashboard/payments?status=${status}&page=${page - 1}`}
                className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:border-gray-300 transition-colors">
                Previous
              </Link>
            )}
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link href={`/admin/dashboard/payments?status=${status}&page=${page + 1}`}
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