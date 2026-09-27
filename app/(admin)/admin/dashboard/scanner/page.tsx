import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import { Search } from 'lucide-react'
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
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
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
  )
}