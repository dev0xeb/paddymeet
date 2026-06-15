import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import ScannerReportGenerator from '@/components/admin/ScannerReportGenerator'

export default async function AdminScannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient.from('admin_team').select('department').eq('id', user.id).single()
  if (!admin || !['super_admin', 'marketing'].includes(admin.department)) redirect('/admin/dashboard')

  const today = new Date().toISOString().split('T')[0]
  const twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Upcoming approved live events in the next 2 weeks
  const { data: upcomingEvents } = await adminClient
    .from('events')
    .select('id, title, event_date, city, state, event_type, vibe, organisers(org_name)')
    .eq('is_approved', true)
    .eq('is_live', true)
    .gte('event_date', today)
    .lte('event_date', twoWeeksOut)
    .order('event_date', { ascending: true })

  // Pending events awaiting review
  const { count: pendingCount } = await adminClient
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', false)
    .eq('is_rejected', false)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">AI Scanner</span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">paddy<span className="text-orange-500">meet</span></Link>
      </nav>

      <div className="pt-16 max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1 flex items-center gap-2">
            <Search className="w-6 h-6 text-pink-500" /> Event Scanner
          </h1>
          <p className="text-sm text-gray-500">Collates upcoming events into a report for marketing outreach. For internal use only.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="text-2xl font-extrabold text-gray-900 mb-0.5">{upcomingEvents?.length ?? 0}</div>
            <div className="text-xs text-gray-500">Live events — next 14 days</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="text-2xl font-extrabold text-gray-900 mb-0.5">{pendingCount ?? 0}</div>
            <div className="text-xs text-gray-500">Pending review</div>
          </div>
        </div>

        <ScannerReportGenerator events={upcomingEvents ?? []} />

      </div>
    </div>
  )
}