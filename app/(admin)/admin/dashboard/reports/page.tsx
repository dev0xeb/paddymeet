import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, FileText, Download, TrendingUp, DollarSign,
  Users, Calendar, Ticket, MapPin, Building2, ShieldCheck,
  BarChart2, CheckCircle2, ChevronRight
} from 'lucide-react'
import AdminFinancialExportModal from '@/components/AdminFinancialExportModal'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()

  if (!admin || !['super_admin', 'finance', 'operations', 'support'].includes(admin.department)) {
    redirect('/admin/dashboard')
  }

  const [
    { data: orders },
    { data: users },
    { data: organisers },
    { data: events },
    { data: tickets },
    { data: settings },
  ] = await Promise.all([
    adminClient.from('orders').select('id, amount, service_fee, total_paid, payment_status, created_at, event_id, events(title, city, organiser_id, organisers(org_name))'),
    adminClient.from('users').select('id, city, state, created_at'),
    adminClient.from('organisers').select('id, org_name, is_verified, created_at'),
    adminClient.from('events').select('id, title, city, event_date, is_approved, is_live, created_at, organisers(org_name)'),
    adminClient.from('tickets').select('id, status, purchased_at, event_id'),
    adminClient.from('platform_settings').select('platform_fee_percent').eq('id', 1).single(),
  ])

  const completedOrders = orders?.filter(o => o.payment_status === 'completed') || []
  const totalGross = completedOrders.reduce((sum, o) => sum + (o.total_paid || 0), 0)
  const totalFees = completedOrders.reduce((sum, o) => sum + (o.service_fee || 0), 0)
  const totalTicketSubtotal = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
  const feePercent = settings?.platform_fee_percent ?? 5.0
  const platformCommission = totalTicketSubtotal * (feePercent / 100)
  const organiserPayouts = totalTicketSubtotal - platformCommission
  const platformNetEarnings = totalFees + platformCommission
  const avgOrderValue = completedOrders.length > 0 ? Math.round(totalGross / completedOrders.length) : 0

  // City breakdown
  const cityCountMap: Record<string, number> = {}
  users?.forEach(u => {
    const city = u.city || 'Unknown'
    cityCountMap[city] = (cityCountMap[city] || 0) + 1
  })
  const topCities = Object.entries(cityCountMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Event revenue ranking
  const eventSalesMap: Record<string, { title: string; host: string; city: string; sales: number; count: number }> = {}
  completedOrders.forEach(o => {
    if (!o.event_id) return
    const ev = Array.isArray(o.events) ? o.events[0] : o.events
    const organisersData = ev?.organisers as unknown as { org_name?: string } | { org_name?: string }[] | undefined
    const orgName = Array.isArray(organisersData) ? organisersData[0]?.org_name : organisersData?.org_name

    if (!eventSalesMap[o.event_id]) {
      eventSalesMap[o.event_id] = {
        title: ev?.title || 'Event',
        host: orgName || 'Host',
        city: ev?.city || 'Lagos',
        sales: 0,
        count: 0
      }
    }
    eventSalesMap[o.event_id].sales += o.total_paid || 0
    eventSalesMap[o.event_id].count += 1
  })
  const topRankedEvents = Object.entries(eventSalesMap).sort((a, b) => b[1].sales - a[1].sales).slice(0, 5)

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
            Platform Reports & Analytics
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header & Export Modal */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Executive Reports</h1>
            <p className="text-xs text-slate-500">Cross-platform financial statements, event analytics, and community intelligence.</p>
          </div>
          <AdminFinancialExportModal events={events?.map(e => ({ id: e.id, title: e.title })) || []} />
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gross Volume</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
              ₦{totalGross.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{completedOrders.length} completed transactions</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Platform Net Earnings</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
              ₦{platformNetEarnings.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">5.0% commission + service fees</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg. Order Value</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
              ₦{avgOrderValue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Per checkout cart</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Host Payouts Due</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
              ₦{organiserPayouts.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Net 95% payable to creators</div>
          </div>
        </div>

        {/* 2-Column Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Top Performing Events */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-bold text-slate-900">Top Revenue Generating Events</h2>
              </div>
              <Link href="/admin/dashboard/events" className="text-xs font-semibold text-orange-600 hover:underline">
                View All →
              </Link>
            </div>

            {topRankedEvents.length > 0 ? (
              <div className="space-y-3">
                {topRankedEvents.map(([id, ev], index) => (
                  <div key={id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{ev.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{ev.host} · {ev.city}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-3">
                      <div className="text-xs font-extrabold text-emerald-600">₦{ev.sales.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">{ev.count} order{ev.count === 1 ? '' : 's'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-400">No event ticket sales recorded yet</p>
              </div>
            )}
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-slate-900">User Audience by City</h2>
              </div>
              <span className="text-xs text-slate-400">{users?.length || 0} total users</span>
            </div>

            {topCities.length > 0 ? (
              <div className="space-y-3">
                {topCities.map(([city, count]) => {
                  const percent = users?.length ? Math.round((count / users.length) * 100) : 0
                  return (
                    <div key={city} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">{city}</span>
                        <span className="font-bold text-slate-900">{count} users ({percent}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-400">No user location data available</p>
              </div>
            )}
          </div>

        </div>

        {/* Ready-to-Export Report Packages */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Exportable Intelligence Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Financial Ledger Package */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">Financial Reconciliation Statement</h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                  Full transaction-by-transaction statement with platform fees, gateway references, and subtotal amounts.
                </p>
              </div>
              <a
                href="/api/admin/reports/financial-export"
                download
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download Full CSV
              </a>
            </div>

            {/* Organiser Payout Package */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">Host Payout Disbursement List</h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                  Complete breakdown of net funds owed to verified hosts and event organisers after platform fees.
                </p>
              </div>
              <a
                href="/api/admin/reports/financial-export?status=completed"
                download
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download Payouts CSV
              </a>
            </div>

            {/* Ticket Distribution Package */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                  <Ticket className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">Live Sales & Attendance Register</h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                  Summary of tickets sold across all active events with check-in rates and attendee distributions.
                </p>
              </div>
              <Link
                href="/admin/dashboard/tickets"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                View Tickets Register <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
