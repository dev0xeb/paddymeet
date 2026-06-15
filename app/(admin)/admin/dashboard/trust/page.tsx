import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, Search } from 'lucide-react'
import TrustScoreEditor from '@/components/admin/TrustScoreEditor'

export default async function AdminTrustPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient.from('admin_team').select('department').eq('id', user.id).single()
  if (!admin || !['super_admin', 'support'].includes(admin.department)) redirect('/admin/dashboard')

  const params = await searchParams
  const q = params.q || ''
  const page = parseInt(params.page || '1')
  const pageSize = 25
  const offset = (page - 1) * pageSize

  let query = adminClient
    .from('users')
    .select('id, username, full_name, email, trust_score, tier, events_attended, fresh_groups_count, is_restricted, created_at', { count: 'exact' })
    .order('trust_score', { ascending: false })

  if (q) query = query.ilike('username', `%${q}%`)

  const { data: users, count } = await query.range(offset, offset + pageSize - 1)

  const { data: settings } = await adminClient
    .from('platform_settings')
    .select('newbie_min, social_min, crew_min, elite_min, legendary_min')
    .eq('id', 1)
    .single()

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const tierColors: Record<string, string> = {
    Newbie: 'bg-gray-100 text-gray-600',
    Social: 'bg-green-50 text-green-600',
    Crew: 'bg-blue-50 text-blue-600',
    Elite: 'bg-purple-50 text-purple-600',
    Legendary: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">Trust Scores</span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">paddy<span className="text-orange-500">meet</span></Link>
      </nav>

      <div className="pt-16 max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Trust Scores</h1>
          <p className="text-sm text-gray-500">View and adjust user trust scores. Tiers update automatically based on score.</p>
        </div>

        {/* Tier thresholds info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-extrabold text-gray-900">Current Tier Thresholds</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Newbie', min: settings?.newbie_min ?? 0, color: tierColors.Newbie },
              { label: 'Social', min: settings?.social_min ?? 20, color: tierColors.Social },
              { label: 'Crew', min: settings?.crew_min ?? 40, color: tierColors.Crew },
              { label: 'Elite', min: settings?.elite_min ?? 60, color: tierColors.Elite },
              { label: 'Legendary', min: settings?.legendary_min ?? 80, color: tierColors.Legendary },
            ].map(({ label, min, color }) => (
              <span key={label} className={`px-3 py-1.5 rounded-full text-xs font-bold ${color}`}>
                {label}: {min}+
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Edit thresholds in <Link href="/admin/dashboard/platform-settings" className="text-orange-500 font-semibold hover:underline">Platform Settings</Link></p>
        </div>

        {/* Search */}
        <form className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by username..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all"
            />
          </div>
        </form>

        {/* Users table */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-6 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span className="col-span-2">User</span>
            <span>Tier</span>
            <span>Events</span>
            <span>Groups</span>
            <span>Trust Score</span>
          </div>
          {users && users.length > 0 ? (
            users.map((u) => (
              <div key={u.id} className="flex flex-col sm:grid sm:grid-cols-6 gap-2 sm:gap-4 px-4 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors items-start sm:items-center">
                <div className="sm:col-span-2 min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{u.username}</div>
                  <div className="text-xs text-gray-400 truncate">{u.email}</div>
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tierColors[u.tier] || tierColors.Newbie}`}>{u.tier || 'Newbie'}</span>
                </div>
                <div className="text-sm text-gray-600">{u.events_attended ?? 0}</div>
                <div className="text-sm text-gray-600">{u.fresh_groups_count ?? 0}</div>
                <TrustScoreEditor userId={u.id} currentScore={u.trust_score ?? 50} />
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400">No users found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {page > 1 && (
              <Link href={`/admin/dashboard/trust?q=${q}&page=${page - 1}`}
                className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:border-gray-300 transition-colors">
                Previous
              </Link>
            )}
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link href={`/admin/dashboard/trust?q=${q}&page=${page + 1}`}
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