import PayoutActionButtons from '@/components/admin/PayoutActionButtons'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, DollarSign, CheckCircle, Clock, XCircle, Building2,
  AlertTriangle, ShieldCheck, CreditCard, ChevronRight
} from 'lucide-react'

export default async function AdminPayoutsPage() {
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

  const [
    { data: orders },
    { data: payouts },
    { data: settings },
  ] = await Promise.all([
    adminClient
      .from('orders')
      .select('*, events(title, organiser_id, organisers(org_name, bank_name, account_number, account_name, is_verified))')
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false }),
    adminClient
      .from('payouts')
      .select('*, organisers(org_name)')
      .order('created_at', { ascending: false })
      .limit(50),
    adminClient
      .from('platform_settings')
      .select('platform_fee_percent')
      .eq('id', 1)
      .single(),
  ])

  const commissionRate = (settings?.platform_fee_percent ?? 5.0) / 100
  const organiserCutRatio = 1 - commissionRate // e.g. 0.95 (95%)

  // Calculate pending payouts per organiser
  const organiserTotals: Record<string, {
    org_name: string
    total: number
    gross: number
    orders: number
    bank_name: string
    account_number: string
    account_name: string
    is_verified: boolean
    organiser_id: string
  }> = {}

  orders?.forEach(order => {
    const event = Array.isArray(order.events) ? order.events[0] : order.events
    if (!event) return
    const organiser = Array.isArray(event.organisers) ? event.organisers[0] : event.organisers
    if (!organiser) return
    const id = event.organiser_id

    if (!organiserTotals[id]) {
      organiserTotals[id] = {
        org_name: organiser.org_name || 'Organiser',
        total: 0,
        gross: 0,
        orders: 0,
        bank_name: organiser.bank_name || '—',
        account_number: organiser.account_number || '—',
        account_name: organiser.account_name || '—',
        is_verified: organiser.is_verified ?? false,
        organiser_id: id,
      }
    }
    const ticketAmount = order.amount || order.total_paid || 0
    organiserTotals[id].gross += ticketAmount
    organiserTotals[id].total += ticketAmount * organiserCutRatio
    organiserTotals[id].orders += 1
  })

  const pendingPayouts = Object.values(organiserTotals)
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.total, 0)
  const totalPaid = payouts?.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0) || 0

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
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Host Disbursements
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Organiser Payouts</h1>
          <p className="text-xs text-slate-500">Manage creator disbursements, verify bank details, and track payout settlements.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: 'Pending Payouts',
              value: `₦${totalPending.toLocaleString()}`,
              subtext: `${pendingPayouts.length} host account(s) awaiting disbursement`,
              icon: Clock,
              color: 'orange'
            },
            {
              label: 'Total Paid Out',
              value: `₦${totalPaid.toLocaleString()}`,
              subtext: 'Historical settled payouts',
              icon: CheckCircle,
              color: 'emerald'
            },
            {
              label: 'Platform Payout Fee',
              value: `${(commissionRate * 100).toFixed(1)}%`,
              subtext: 'Creator net share: 95.0%',
              icon: Building2,
              color: 'blue'
            },
          ].map(({ label, value, subtext, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  color === 'orange' ? 'bg-orange-50 text-orange-600' :
                  color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">{value}</div>
              <div className="text-[11px] text-slate-400 font-medium">{subtext}</div>
            </div>
          ))}
        </div>

        {/* Pending Payouts Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Pending Host Disbursements</h2>
            <span className="text-xs text-slate-400">{pendingPayouts.length} Organiser(s)</span>
          </div>

          {pendingPayouts.length > 0 ? (
            <div className="space-y-3">
              {pendingPayouts.map((payout) => {
                const hasBank = payout.account_number && payout.account_number !== '—'

                return (
                  <div
                    key={payout.organiser_id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Host Avatar & Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                        {payout.org_name?.charAt(0).toUpperCase() || 'H'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-slate-900 truncate">{payout.org_name}</span>
                          {payout.is_verified ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              KYC Pending
                            </span>
                          )}
                        </div>

                        {/* Bank Details Display */}
                        {hasBank ? (
                          <div className="text-xs text-slate-600 font-medium">
                            {payout.bank_name} · <span className="font-mono font-bold text-slate-900">{payout.account_number}</span> ({payout.account_name})
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            No Bank Account Linked by Host
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount & Action Buttons */}
                    <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                      <div className="text-left md:text-right">
                        <div className="text-base font-extrabold text-emerald-700 tracking-tight">
                          ₦{payout.total.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {payout.orders} order{payout.orders !== 1 ? 's' : ''} · Gross: ₦{payout.gross.toLocaleString()}
                        </div>
                      </div>

                      <PayoutActionButtons
                        organiserId={payout.organiser_id}
                        orgName={payout.org_name}
                        amount={payout.total}
                        ordersCount={payout.orders}
                        bankName={payout.bank_name}
                        accountNumber={payout.account_number}
                        accountName={payout.account_name}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
              <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No pending payouts</p>
              <p className="text-xs text-slate-400 mt-0.5">All event ticket revenues have been disbursed to hosts.</p>
            </div>
          )}
        </div>

        {/* Payout History Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Settled Payout History</h2>
          {payouts && payouts.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {payouts.map((payout) => {
                const org = Array.isArray(payout.organisers) ? payout.organisers[0] : payout.organisers
                const isPaid = payout.status === 'paid'
                const isHold = payout.status === 'held' || payout.status === 'on_hold'

                return (
                  <div key={payout.id} className="flex items-center justify-between py-3.5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        isPaid ? 'bg-emerald-500' : isHold ? 'bg-rose-500' : 'bg-amber-400'
                      }`} />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{org?.org_name || 'Organiser'}</div>
                        <div className="text-[11px] text-slate-400">
                          {payout.payment_reference ? `Ref: ${payout.payment_reference} · ` : ''}
                          {new Date(payout.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {payout.payment_method ? ` via ${payout.payment_method}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="font-extrabold text-slate-900">₦{(payout.amount || 0).toLocaleString()}</div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        isHold ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {payout.status || 'paid'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-400">No payout settlements recorded in history yet</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}