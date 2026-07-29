import PayoutActionButtons from '@/components/admin/PayoutActionButtons'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, CheckCircle, Clock, XCircle, Building2 } from 'lucide-react'

export default async function AdminPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient.from('admin_team').select('department').eq('id', user.id).single()
  if (!admin || !['super_admin', 'finance'].includes(admin.department)) redirect('/admin/dashboard')

  // Get all orders grouped by organiser
  const { data: orders } = await adminClient
    .from('orders')
    .select('*, events(title, organiser_id, organisers(org_name, bank_name, account_number, account_name))')
    .eq('payment_status', 'completed')
    .order('created_at', { ascending: false })

  // Get payouts
  const { data: payouts } = await adminClient
    .from('payouts')
    .select('*, organisers(org_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  // Calculate pending payouts per organiser
  const organiserTotals: Record<string, { org_name: string, total: number, orders: number, bank_name: string, account_number: string, account_name: string, organiser_id: string }> = {}
  orders?.forEach(order => {
    const event = Array.isArray(order.events) ? order.events[0] : order.events
    if (!event) return
    const organiser = Array.isArray(event.organisers) ? event.organisers[0] : event.organisers
    if (!organiser) return
    const id = event.organiser_id
    if (!organiserTotals[id]) {
      organiserTotals[id] = {
        org_name: organiser.org_name,
        total: 0,
        orders: 0,
        bank_name: organiser.bank_name || '—',
        account_number: organiser.account_number || '—',
        account_name: organiser.account_name || '—',
        organiser_id: id,
      }
    }
    organiserTotals[id].total += (order.total_paid || 0) * 0.9 // 10% commission
    organiserTotals[id].orders += 1
  })

  const pendingPayouts = Object.values(organiserTotals)
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.total, 0)
  const totalPaid = payouts?.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Payouts</span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">paddy<span className="text-orange-500">meet</span></Link>
      </nav>

      <div className="pt-16 max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Payouts</h1>
            <p className="text-sm text-gray-500">Manage organiser payouts and payment history</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending payouts', value: `₦${(totalPending / 1000).toFixed(0)}k`, icon: Clock, color: 'orange' },
            { label: 'Total paid out', value: `₦${(totalPaid / 1000).toFixed(0)}k`, icon: CheckCircle, color: 'green' },
            { label: 'Organisers pending', value: pendingPayouts.length.toString(), icon: Building2, color: 'blue' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                color === 'orange' ? 'bg-orange-50' : color === 'green' ? 'bg-green-50' : 'bg-blue-50'
              }`}>
                <Icon className={`w-4 h-4 ${
                  color === 'orange' ? 'text-orange-500' : color === 'green' ? 'text-green-500' : 'text-blue-500'
                }`} />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 mb-0.5">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Pending payouts table */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-extrabold text-gray-900 mb-4">Pending Payouts</h2>
          {pendingPayouts.length > 0 ? (
            <div className="space-y-3">
              {pendingPayouts.map((payout) => (
                <div key={payout.organiser_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {payout.org_name?.charAt(0) || 'O'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900">{payout.org_name}</div>
                    <div className="text-xs text-gray-500">{payout.bank_name} · {payout.account_number} · {payout.account_name}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-extrabold text-gray-900">₦{payout.total.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">{payout.orders} orders</div>
                  </div>
                  <PayoutActionButtons
                    organiserId={payout.organiser_id}
                    orgName={payout.org_name}
                    amount={payout.total}
                    ordersCount={payout.orders}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No pending payouts</p>
            </div>
          )}
        </div>

        {/* Payout history */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-sm font-extrabold text-gray-900 mb-4">Payout History</h2>
          {payouts && payouts.length > 0 ? (
            <div className="space-y-2">
              {payouts.map((payout) => {
                const org = Array.isArray(payout.organisers) ? payout.organisers[0] : payout.organisers
                return (
                  <div key={payout.id} className="flex items-center gap-4 p-3 border-b border-gray-50 last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${payout.status === 'paid' ? 'bg-green-500' : payout.status === 'pending' ? 'bg-orange-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-900">{org?.org_name || '—'}</div>
                      <div className="text-xs text-gray-400">{new Date(payout.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div className="text-sm font-bold text-gray-900">₦{(payout.amount || 0).toLocaleString()}</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      payout.status === 'paid' ? 'bg-green-50 text-green-600' :
                      payout.status === 'pending' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'
                    }`}>{payout.status}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No payout history yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}