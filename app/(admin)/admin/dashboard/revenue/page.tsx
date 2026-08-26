import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, TrendingUp, Percent, Calendar, ShieldCheck, Building2 } from 'lucide-react'

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
    adminClient.from('platform_settings').select('platform_fee_percent').eq('id', 1).single(),
  ])

  const commissionRate = (settings?.platform_fee_percent ?? 5.0) / 100

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
            Revenue Analytics
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Revenue Overview</h1>
          <p className="text-xs text-slate-500">Platform-wide financial statement, commissions, and host payout breakdown.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Gross Transaction Volume',
              value: `₦${totalGross.toLocaleString()}`,
              subtext: 'Total volume processed',
              icon: DollarSign,
              color: 'emerald'
            },
            {
              label: 'Platform Net Earnings',
              value: `₦${platformEarnings.toLocaleString()}`,
              subtext: 'Fees + Commission retained',
              icon: TrendingUp,
              color: 'blue'
            },
            {
              label: 'Platform Commission Rate',
              value: `${(commissionRate * 100).toFixed(1)}%`,
              subtext: 'Configured platform fee',
              icon: Percent,
              color: 'orange'
            },
            {
              label: 'Owed to Organisers',
              value: `₦${organiserPayout.toLocaleString()}`,
              subtext: 'Scheduled host transfers',
              icon: Calendar,
              color: 'purple'
            },
          ].map(({ label, value, subtext, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">{value}</div>
              <div className="text-[11px] text-slate-400 font-medium">{subtext}</div>
            </div>
          ))}
        </div>

        {/* Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Monthly Revenue Chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-slate-900">Revenue by Month</h2>
              <span className="text-xs text-slate-400">Last 6 months</span>
            </div>
            {monthlyEntries.length > 0 ? (
              <div className="space-y-4">
                {monthlyEntries.map(([month, value]) => (
                  <div key={month} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{month}</span>
                      <span className="font-bold text-slate-900">₦{value.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${(value / maxMonthly) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400">No monthly revenue records found</p>
              </div>
            )}
          </div>

          {/* Revenue Breakdown Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Financial Ledger Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: 'Gross Ticket Sales', value: totalTicketRevenue, desc: 'Base ticket prices paid by attendees' },
                { label: 'Processing / Service Fees', value: totalServiceFees, desc: 'Transactional processing fees' },
                { label: 'Platform Commission (5%)', value: platformCommission, desc: 'Platform retained cut' },
                { label: 'Net Organiser Payouts', value: organiserPayout, desc: 'Payable to verified event hosts' },
              ].map(({ label, value, desc }) => (
                <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-slate-600">{label}</span>
                    <span className="text-sm font-extrabold text-slate-900">₦{value.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Earning Events */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Top Earning Events</h2>
            <Link href="/admin/dashboard/events" className="text-xs font-semibold text-orange-600 hover:underline">
              View All Events →
            </Link>
          </div>
          {topEvents && topEvents.length > 0 ? (
            <div className="space-y-3">
              {topEventIds.map(([eventId, revenue]) => {
                const event = topEvents.find(e => e.id === eventId)
                const org = Array.isArray(event?.organisers) ? event.organisers[0] : event?.organisers
                return (
                  <div key={eventId} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {event?.title?.charAt(0).toUpperCase() || 'E'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{event?.title || 'Unknown Event'}</div>
                        <div className="text-xs text-slate-500">Host: {org?.org_name || 'Organiser'}</div>
                      </div>
                    </div>
                    <div className="text-base font-extrabold text-emerald-600 whitespace-nowrap">
                      ₦{revenue.toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-400">No event revenue transactions recorded yet</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}