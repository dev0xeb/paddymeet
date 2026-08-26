import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Shield, Search, ShieldCheck, ShieldAlert,
  Users, CheckCircle2, User, Award, ExternalLink
} from 'lucide-react'
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
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()

  if (!admin || !['super_admin', 'support', 'operations'].includes(admin.department)) {
    redirect('/admin/dashboard')
  }

  const params = await searchParams
  const q = params.q || ''
  const page = parseInt(params.page || '1')
  const pageSize = 20
  const offset = (page - 1) * pageSize

  let query = adminClient
    .from('users')
    .select('id, username, full_name, email, trust_score, tier, events_attended, fresh_groups_count, is_suspended, is_restricted, created_at', { count: 'exact' })
    .order('trust_score', { ascending: false })

  if (q) {
    query = query.or(`username.ilike.%${q}%,email.ilike.%${q}%,full_name.ilike.%${q}%`)
  }

  const [
    { data: users, count },
    { data: settings }
  ] = await Promise.all([
    query.range(offset, offset + pageSize - 1),
    adminClient
      .from('platform_settings')
      .select('newbie_min, social_min, crew_min, elite_min, legendary_min')
      .eq('id', 1)
      .single()
  ])

  const thresholds = {
    newbie: settings?.newbie_min ?? 0,
    social: settings?.social_min ?? 20,
    crew: settings?.crew_min ?? 40,
    elite: settings?.elite_min ?? 60,
    legendary: settings?.legendary_min ?? 80,
  }

  const getTier = (score: number) => {
    if (score >= thresholds.legendary) return { label: 'Legendary', color: 'bg-orange-50 text-orange-700 border-orange-200' }
    if (score >= thresholds.elite) return { label: 'Elite', color: 'bg-purple-50 text-purple-700 border-purple-200' }
    if (score >= thresholds.crew) return { label: 'Crew', color: 'bg-blue-50 text-blue-700 border-blue-200' }
    if (score >= thresholds.social) return { label: 'Social', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    return { label: 'Newbie', color: 'bg-slate-100 text-slate-700 border-slate-200' }
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize)

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
            Trust & Community Moderation
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Trust Score Management</h1>
            <p className="text-xs text-slate-500">Monitor attendee reputation scores, adjust community tiers, and manage dispute overrides.</p>
          </div>

          <form className="relative min-w-[280px]">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search user by username or email..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </form>
        </div>

        {/* Tier Thresholds Header Banner */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-bold text-slate-900">Current Reputation Thresholds</h2>
            </div>
            <Link
              href="/admin/dashboard/platform-settings"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              Configure in Platform Settings <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Newbie', min: thresholds.newbie, color: 'bg-slate-100 text-slate-700 border-slate-200' },
              { label: 'Social', min: thresholds.social, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'Crew', min: thresholds.crew, color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Elite', min: thresholds.elite, color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { label: 'Legendary', min: thresholds.legendary, color: 'bg-orange-50 text-orange-700 border-orange-200' },
            ].map(({ label, min, color }) => (
              <div key={label} className={`p-3 rounded-xl border ${color} text-center`}>
                <div className="text-xs font-bold">{label}</div>
                <div className="text-[11px] opacity-75 mt-0.5">{min}+ Score</div>
              </div>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Reputation Tier</th>
                  <th className="py-3 px-4 text-center">Events Attended</th>
                  <th className="py-3 px-4 text-center">Groups</th>
                  <th className="py-3 px-4">Account Standing</th>
                  <th className="py-3 px-4">Trust Score Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users && users.length > 0 ? (
                  users.map((u) => {
                    const activeScore = u.trust_score ?? 50
                    const tier = getTier(activeScore)
                    const isSuspended = u.is_suspended || u.is_restricted

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* User Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                              {u.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{u.username}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Calculated Tier Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${tier.color}`}>
                            <Award className="w-3 h-3" />
                            {tier.label}
                          </span>
                        </td>

                        {/* Events Attended */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {u.events_attended ?? 0}
                        </td>

                        {/* Groups */}
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                          {u.fresh_groups_count ?? 0}
                        </td>

                        {/* Standing */}
                        <td className="py-3.5 px-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <ShieldAlert className="w-3 h-3" /> Restricted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> Good Standing
                            </span>
                          )}
                        </td>

                        {/* Interactive Editor */}
                        <td className="py-3.5 px-4">
                          <TrustScoreEditor
                            userId={u.id}
                            currentScore={activeScore}
                            thresholds={thresholds}
                          />
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No users found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try searching for a different username or email.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-xs">
            <span className="text-slate-500 font-medium">
              Showing page {page} of {totalPages} ({count} users)
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/dashboard/trust?page=${page - 1}${q ? `&q=${q}` : ''}`}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/dashboard/trust?page=${page + 1}${q ? `&q=${q}` : ''}`}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}