import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, TrendingUp, Percent, Calendar } from 'lucide-react'

export default async function AdminRevenuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient.from('admin_team').select('department').eq('id', user.id).single()
  if (!admin || !['super_admin', 'finance'].includes(admin.department)) redirect('/admin/dashboard')

  const [
    { data: orders },
    { data: settings },
  ] = await Promise.all([
    adminClient.from('orders').select('total_paid, service_fee, amount, created_at, event_id, payment_status').eq('payment_status', 'completed'),
    adminClient.from('platform_settings').select('commission_rate').eq('id', 1).single(),
  ])

  const commissionRate = (settings?.commission_rate ?? 10) / 100

  const totalGross = orders?.reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0
  const totalServiceFees = orders?.reduce((sum, o) => sum + (o.service_fee || 0), 0) || 0
  const totalTicketRevenue = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0
  const platformCommission = totalTicketRevenue * commissionRate
  const organiserPayout = totalTicketRevenue - platformCommission
  const platformEarnings = totalServiceFees + platformCommission

  // Revenue by month (last 6 months)
  const monthlyRevenue: Record<string, number> = {}
  orders?.forEach(order => {
    const date = new Date(order.created_at)
    const key = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + (order.total_paid || 0)
  })
  const monthlyEntries = Object.entries(monthlyRevenue).slice(-6)
  const maxMonthly = Math.max(...monthlyEntries.map(([, v]) => v), 1)

  // Top events by revenue
  const eventRevenue: Record<string, number> = {}
  orders?.forEach(order => {
    if (!order.event_id) return
    eventRevenue[order.event_id] = (eventRevenue[order.event_id] || 0) + (order.total_paid || 0)
  })
  const topEventIds = Object.entries(eventRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const { data: topEvents } = topEventIds.length > 0
    ? await adminClient.from('events').select('id, title, organisers(org_name)').in('id', topEventIds.map(([id]) => id))
    : { data: [] }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Revenue</span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">paddy<span className="text-orange-500">meet</span></Link>
      </nav>

      <div className="pt-16 max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Revenue Overview</h1>
          <p className="text-sm text-gray-500">Platform-wide earnings and commission breakdown</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Gross transaction volume', value: `₦${(totalGross/1000).toFixed(0)}k`, icon: DollarSign, color: 'blue' },
            { label: 'Platform earnings', value: `₦${(platformEarnings/1000).toFixed(0)}k`, icon: TrendingUp, color: 'green' },
            { label: 'Commission rate', value: `${(commissionRate * 100).toFixed(0)}%`, icon: Percent, color: 'orange' },
            { label: 'Owed to organisers', value: `₦${(organiserPayout/1000).toFixed(0)}k`, icon: Calendar, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                color === 'blue' ? 'bg-blue-50' : color === 'green' ? 'bg-green-50' : color === 'orange' ? 'bg-orange-50' : 'bg-purple-50'
              }`}>
                <Icon className={`w-4 h-4 ${
                  color === 'blue' ? 'text-blue-500' : color === 'green' ? 'text-green-500' : color === 'orange' ? 'text-orange-500' : 'text-purple-500'
                }`} />
              </div>
              <div className="text-xl md:text-2xl font-extrabold text-gray-900 mb-0.5">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

          {/* Monthly chart */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 md:p-6">
            <h2 className="text-sm font-extrabold text-gray-900 mb-5">Revenue by Month</h2>
            {monthlyEntries.length > 0 ? (
              <div className="space-y-3">
                {monthlyEntries.map(([month, value]) => (
                  <div key={month}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-600">{month}</span>
                      <span className="font-bold text-gray-900">₦{value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: `${(value / maxMonthly) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No revenue data yet</p>
              </div>
            )}
          </div>

          {/* Revenue breakdown */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6">
            <h2 className="text-sm font-extrabold text-gray-900 mb-5">Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: 'Ticket sales', value: totalTicketRevenue },
                { label: 'Service fees', value: totalServiceFees },
                { label: 'Platform commission', value: platformCommission },
                { label: 'Organiser payouts', value: organiserPayout },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-bold text-gray-900">₦{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top events */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6">
          <h2 className="text-sm font-extrabold text-gray-900 mb-5">Top Earning Events</h2>
          {topEvents && topEvents.length > 0 ? (
            <div className="space-y-3">
              {topEventIds.map(([eventId, revenue]) => {
                const event = topEvents.find(e => e.id === eventId)
                const org = Array.isArray(event?.organisers) ? event.organisers[0] : event?.organisers
                return (
                  <div key={eventId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{event?.title || 'Unknown event'}</div>
                      <div className="text-xs text-gray-500">{org?.org_name || '—'}</div>
                    </div>
                    <div className="text-sm font-extrabold text-green-600">₦{revenue.toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No revenue data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}