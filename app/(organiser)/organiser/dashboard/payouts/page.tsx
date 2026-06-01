import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CreditCard, Clock, CheckCircle,
  AlertCircle, DollarSign, ArrowUpRight, Building2
} from 'lucide-react'

export default async function OrganiserPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!organiser) redirect('/login')

  const { data: events } = await supabase
    .from('events')
    .select('id')
    .eq('organiser_id', user.id)

  const eventIds = events?.map(e => e.id) || []

  const { data: allOrders } = await supabase
    .from('orders')
    .select('total_paid, service_fee, created_at')
    .in('event_id', eventIds)

  const grossRevenue = allOrders?.reduce((sum, o) => sum + (o.total_paid || 0), 0) || 0
  const totalFees = allOrders?.reduce((sum, o) => sum + (o.service_fee || 0), 0) || 0
  const paddymeetCommission = grossRevenue * 0.1
  const netRevenue = grossRevenue - totalFees - paddymeetCommission

  // Get payouts history
  const { data: payouts } = await supabase
    .from('payouts')
    .select('*')
    .eq('organiser_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const totalPaid = payouts?.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const pendingPayout = netRevenue - totalPaid

  const hasBankDetails = organiser.bank_name && organiser.account_number && organiser.account_name

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/organiser/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Payouts
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="w-24" />
      </nav>

      <div className="pt-16 max-w-4xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Payouts</h1>
          <p className="text-sm text-gray-500">Your earnings and payment history</p>
        </div>

        {/* Bank details warning */}
        {!hasBankDetails && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl mb-6">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-bold text-orange-700 mb-1">Add your bank details to receive payouts</div>
              <p className="text-xs text-orange-600 mb-3">Paddymeet needs your bank account details before we can process any payments to you.</p>
              <Link href="/organiser/dashboard/settings"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors">
                Add Bank Details <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Available for payout', value: `₦${Math.max(0, pendingPayout / 1000).toFixed(1)}k`, icon: DollarSign, color: 'green', desc: 'Ready to be paid out' },
            { label: 'Total paid out', value: `₦${(totalPaid / 1000).toFixed(1)}k`, icon: CheckCircle, color: 'blue', desc: 'All time payouts' },
            { label: 'Net revenue', value: `₦${(netRevenue / 1000).toFixed(1)}k`, icon: ArrowUpRight, color: 'purple', desc: 'After all fees' },
          ].map(({ label, value, icon: Icon, color, desc }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                color === 'blue' ? 'bg-blue-50' :
                color === 'green' ? 'bg-green-50' : 'bg-purple-50'
              }`}>
                <Icon className={`w-4 h-4 ${
                  color === 'blue' ? 'text-blue-500' :
                  color === 'green' ? 'text-green-500' : 'text-purple-500'
                }`} />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 tracking-tight mb-0.5">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Payout history */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-extrabold text-gray-900">Payout History</h2>
              </div>

              {payouts && payouts.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        payout.status === 'completed' ? 'bg-green-50' :
                        payout.status === 'pending' ? 'bg-orange-50' : 'bg-red-50'
                      }`}>
                        {payout.status === 'completed'
                          ? <CheckCircle className="w-5 h-5 text-green-500" />
                          : payout.status === 'pending'
                          ? <Clock className="w-5 h-5 text-orange-500" />
                          : <AlertCircle className="w-5 h-5 text-red-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900">
                          ₦{payout.amount?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payout.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {payout.reference && <span className="ml-2 font-mono text-gray-400">{payout.reference}</span>}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${
                        payout.status === 'completed'
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : payout.status === 'pending'
                          ? 'bg-orange-50 text-orange-500 border-orange-200'
                          : 'bg-red-50 text-red-500 border-red-200'
                      }`}>
                        {payout.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-400 mb-1">No payouts yet</p>
                  <p className="text-xs text-gray-400">Paddymeet processes payouts after each event</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Bank details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-extrabold text-gray-900">Bank Details</h2>
              </div>

              {hasBankDetails ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Bank</div>
                    <div className="text-sm font-bold text-gray-900">{organiser.bank_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Account name</div>
                    <div className="text-sm font-bold text-gray-900">{organiser.account_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Account number</div>
                    <div className="text-sm font-mono font-bold text-gray-900">
                      {'•'.repeat(organiser.account_number.length - 4) + organiser.account_number.slice(-4)}
                    </div>
                  </div>
                  <Link href="/organiser/dashboard/settings"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:border-gray-300 transition-colors mt-3">
                    <CreditCard className="w-3.5 h-3.5" /> Update Details
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 mb-3">No bank details added yet</p>
                  <Link href="/organiser/dashboard/settings"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors">
                    Add Details
                  </Link>
                </div>
              )}
            </div>

            {/* Payout schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4">Payout Schedule</h2>
              <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                  Payouts are processed within 3 to 5 business days after your event ends.
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                  Paddymeet deducts a 10% commission before paying out.
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                  Payment processing fees from Paystack are also deducted.
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                  For disputes or delayed payouts contact support@paddymeet.com.
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}