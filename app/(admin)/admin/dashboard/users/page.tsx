import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Search, Shield, MapPin, Calendar,
  MoreHorizontal, UserX, UserCheck, ChevronLeft, ChevronRight
} from 'lucide-react'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string, page?: string, filter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()

  if (!admin) redirect('/admin/login')

  const params = await searchParams
  const search = params.search || ''
  const page = parseInt(params.page || '1')
  const filter = params.filter || 'all'
  const pageSize = 20
  const offset = (page - 1) * pageSize

  let query = adminClient
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`)
  }

  if (filter === 'suspended') query = query.eq('is_suspended', true)
  if (filter === 'verified') query = query.eq('is_verified', true)

  const { data: users, count } = await query
  const totalPages = Math.ceil((count || 0) / pageSize)

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
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Users Management
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Users</h1>
            <p className="text-sm text-gray-500">
              {count?.toLocaleString() || 0} total users registered
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <form className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full flex-1 max-w-md focus-within:border-orange-400 transition-all">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by username, email or name..."
              className="bg-transparent border-none outline-none text-sm text-gray-900 w-full placeholder:text-gray-400"
            />
          </form>

          <div className="flex gap-2">
            {[
              { label: 'All users', value: 'all' },
              { label: 'Suspended', value: 'suspended' },
            ].map(({ label, value }) => (
              <Link key={value}
                href={`/admin/dashboard/users?filter=${value}${search ? `&search=${search}` : ''}`}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  filter === value
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
            {['User', 'Location', 'Trust Score', 'Tier', 'Joined', 'Actions'].map(h => (
              <div key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>

          {/* Table rows */}
          {users && users.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {users.map((u: {
                id: string
                username: string
                full_name: string
                email: string
                city: string
                state: string
                trust_score: number
                tier: string
                is_suspended: boolean
                created_at: string
                events_attended: number
              }) => (
                <div key={u.id} className="grid grid-cols-6 gap-4 px-5 py-4 hover:bg-gray-50 transition-colors items-center">

                  {/* User */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.username?.replace('@', '').charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{u.username}</div>
                      <div className="text-xs text-gray-400 truncate">{u.email}</div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{u.city || u.state || '—'}</span>
                  </div>

                  {/* Trust score */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-3 h-3 text-orange-400" />
                      <span className="text-xs font-bold text-gray-900">{u.trust_score || 50}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                      <div
                        className="h-full bg-orange-400 rounded-full"
                        style={{ width: `${Math.min(100, u.trust_score || 50)}%` }}
                      />
                    </div>
                  </div>

                  {/* Tier */}
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tierColors[u.tier] || tierColors.Newbie}`}>
                      {u.tier || 'Newbie'}
                    </span>
                  </div>

                  {/* Joined */}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {u.is_suspended ? (
                      <form action={`/api/admin/users/${u.id}/unsuspend`} method="POST">
                        <button type="submit"
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors">
                          <UserCheck className="w-3 h-3" /> Restore
                        </button>
                      </form>
                    ) : (
                      <form action={`/api/admin/users/${u.id}/suspend`} method="POST">
                        <button type="submit"
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">
                          <UserX className="w-3 h-3" /> Suspend
                        </button>
                      </form>
                    )}
                    <Link href={`/admin/dashboard/users/${u.id}`}
                      className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400 mb-1">No users found</p>
              <p className="text-xs text-gray-400">
                {search ? 'Try a different search term' : 'No users have signed up yet'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500">
              Showing {offset + 1}–{Math.min(offset + pageSize, count || 0)} of {count?.toLocaleString()} users
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/admin/dashboard/users?page=${page - 1}${search ? `&search=${search}` : ''}${filter !== 'all' ? `&filter=${filter}` : ''}`}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <Link key={pageNum}
                    href={`/admin/dashboard/users?page=${pageNum}${search ? `&search=${search}` : ''}${filter !== 'all' ? `&filter=${filter}` : ''}`}
                    className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors ${
                      pageNum === page
                        ? 'bg-gray-900 border-gray-900 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {pageNum}
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link href={`/admin/dashboard/users?page=${page + 1}${search ? `&search=${search}` : ''}${filter !== 'all' ? `&filter=${filter}` : ''}`}
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