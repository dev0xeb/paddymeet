import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OrganiserNav from '@/components/OrganiserNav'
import {
  Heart, MapPin, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react'

interface FollowRow {
  id: string
  created_at: string
  users: { username: string, city: string, tier: string } | { username: string, city: string, tier: string }[] | null
}

function getField<T>(val: T | T[] | null): T | null {
  if (!val) return null
  if (Array.isArray(val)) return val[0] || null
  return val
}

const tierColors: Record<string, string> = {
  Newbie: 'bg-gray-100 text-gray-600',
  Social: 'bg-green-50 text-green-600',
  Crew: 'bg-blue-50 text-blue-600',
  Elite: 'bg-purple-50 text-purple-600',
  Legendary: 'bg-orange-50 text-orange-600',
}

export default async function OrganiserFollowersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id, org_name')
    .eq('id', user.id)
    .single()
  if (!organiser) redirect('/login')

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const pageSize = 20
  const offset = (page - 1) * pageSize

  const weekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: rawFollows, count },
    { count: newThisWeek },
  ] = await Promise.all([
    supabase
      .from('follows')
      .select('id, created_at, users(username, city, tier)', { count: 'exact' })
      .eq('organiser_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('organiser_id', user.id)
      .gte('created_at', weekAgo),
  ])

  const follows = rawFollows as unknown as FollowRow[]
  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganiserNav orgName={organiser.org_name} />
      <div className="pt-24 md:pt-16 max-w-5xl mx-auto px-4 md:px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Followers</h1>
          <p className="text-sm text-gray-500">Explorers who follow your events</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center mb-3">
              <Heart className="w-4 h-4 text-pink-500" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight mb-0.5">
              {(count ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 font-medium">Total followers</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <Calendar className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight mb-0.5">
              {(newThisWeek ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 font-medium">New this week</div>
          </div>
        </div>

        {/* Followers table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="hidden sm:grid grid-cols-4 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
            {['Follower', 'Location', 'Tier', 'Following Since'].map(h => (
              <div key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>

          {follows && follows.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {follows.map((follow) => {
                const u = getField(follow.users)
                return (
                  <div key={follow.id} className="flex flex-col sm:grid sm:grid-cols-4 gap-2 sm:gap-3 px-4 py-4 hover:bg-gray-50 transition-colors sm:items-center">

                    {/* Follower */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u?.username?.replace('@', '').charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="text-xs font-bold text-gray-900 truncate">{u?.username || 'Unknown'}</div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {u?.city || '—'}
                    </div>

                    {/* Tier */}
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tierColors[u?.tier || ''] || tierColors.Newbie}`}>
                        {u?.tier || 'Newbie'}
                      </span>
                    </div>

                    {/* Following since */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {follow.created_at
                        ? new Date(follow.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </div>

                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Heart className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400 mb-1">No followers yet</p>
              <p className="text-xs text-gray-400">Explorers who follow your events will show up here</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500">
              Showing {offset + 1}–{Math.min(offset + pageSize, count || 0)} of {count?.toLocaleString()} followers
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/organiser/dashboard/followers?page=${page - 1}`}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <Link key={pageNum}
                    href={`/organiser/dashboard/followers?page=${pageNum}`}
                    className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors flex items-center justify-center ${
                      pageNum === page ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {pageNum}
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link href={`/organiser/dashboard/followers?page=${page + 1}`}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
