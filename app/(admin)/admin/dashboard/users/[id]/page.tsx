import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Shield, MapPin, Calendar, Ticket,
  UserX, UserCheck, Trash2, Star, Users,
  Clock, CheckCircle, Flag
} from 'lucide-react'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()
  if (!admin) redirect('/admin-login')

  // Fetch user profile
  const { data: profile } = await adminClient
    .from('users')
    .select('*, user_interests(*)')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  // Disabled queries — will enable once confirmed working
  const tickets: never[] = []
  const trustHistory: never[] = []
  const reports: never[] = []

  const tierColors: Record<string, string> = {
    Newbie: 'bg-gray-100 text-gray-600',
    Social: 'bg-green-50 text-green-600',
    Crew: 'bg-blue-50 text-blue-600',
    Elite: 'bg-purple-50 text-purple-600',
    Legendary: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/users" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Users
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            User Detail
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">

          {/* Left — profile */}
          <div className="space-y-5">

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-extrabold text-xl">
                  {profile.username?.replace('@', '').charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-extrabold text-gray-900">{profile.username}</div>
                  <div className="text-xs text-gray-500">{profile.email}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tierColors[profile.tier] || tierColors.Newbie}`}>
                      {profile.tier || 'Newbie'}
                    </span>
                    {profile.is_suspended && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-500 border border-red-200 rounded-full text-xs font-bold">
                        Suspended
                      </span>
                    )}
                    {profile.is_deleted && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
                        Deleted
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {profile.city || '—'}{profile.state ? `, ${profile.state}` : ''}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Shield className="w-3.5 h-3.5 text-orange-400" />
                  Trust score: <span className="font-bold text-orange-500">{profile.trust_score || 50}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Star className="w-3.5 h-3.5 text-gray-400" />
                  Chemistry: <span className="font-bold text-gray-900">{profile.chemistry_score || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl mb-5 text-center">
                {[
                  { label: 'Events', value: profile.events_attended || 0 },
                  { label: 'Groups', value: profile.fresh_groups_count || 0 },
                  { label: 'Referrals', value: 0 },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-base font-extrabold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              {/* Interests */}
              {profile.user_interests && profile.user_interests.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Interests</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.user_interests.slice(0, 6).map((i: { interest: string }) => (
                      <span key={i.interest} className="px-2.5 py-1 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold rounded-full">
                        {i.interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account Actions</div>

                {!profile.is_suspended && !profile.is_deleted && (
                  <form action={`/api/admin/users/${id}/suspend`} method="POST">
                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold rounded-xl hover:bg-orange-100 transition-colors">
                      <UserX className="w-3.5 h-3.5" /> Suspend Account
                    </button>
                  </form>
                )}

                {profile.is_suspended && !profile.is_deleted && (
                  <form action={`/api/admin/users/${id}/unsuspend`} method="POST">
                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-xl hover:bg-green-100 transition-colors">
                      <UserCheck className="w-3.5 h-3.5" /> Restore Account
                    </button>
                  </form>
                )}

                {!profile.is_deleted && (
                  <form action={`/api/admin/users/${id}/delete`} method="POST">
                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Account
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Reports */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flag className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-extrabold text-gray-900">Reports</h2>
              </div>
              {reports.length > 0 ? (
                <div className="space-y-2">
                  {reports.map((report: never) => (
                    <div key={(report as { id: string }).id} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div className="text-xs text-gray-400">Report</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">No reports</p>
                </div>
              )}
            </div>

          </div>

          {/* Right — activity */}
          <div className="col-span-2 space-y-5">

            {/* Tickets */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-extrabold text-gray-900">Tickets</h2>
              </div>
              {tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.map((ticket: never) => (
                    <div key={(ticket as { id: string }).id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500">Ticket</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Ticket className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No tickets purchased yet</p>
                </div>
              )}
            </div>

            {/* Trust score history */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-extrabold text-gray-900">Trust Score History</h2>
              </div>
              {trustHistory.length > 0 ? (
                <div className="space-y-2">
                  {trustHistory.map((item: never) => (
                    <div key={(item as { id: string }).id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500">Trust history</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No trust score activity yet</p>
                </div>
              )}
            </div>

            {/* Groups */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-extrabold text-gray-900">Groups</h2>
              </div>
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Group history coming soon</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}