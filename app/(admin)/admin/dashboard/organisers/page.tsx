import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Search, CheckCircle, XCircle, Eye,
  MapPin, Calendar, ChevronLeft, ChevronRight,
  Building2, Ticket, DollarSign
} from 'lucide-react'

export default async function AdminOrganisersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string, page?: string, filter?: string }>
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
  if (!admin) redirect('/admin-login')

  const params = await searchParams
  const search = params.search || ''
  const page = parseInt(params.page || '1')
  const filter = params.filter || 'all'
  const pageSize = 20
  const offset = (page - 1) * pageSize

  let query = adminClient
    .from('organisers')
    .select('*, organiser_event_types(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (search) {
    query = query.or(`org_name.ilike.%${search}%,email.ilike.%${search}%,contact_name.ilike.%${search}%`)
  }

  if (filter === 'verified') query = query.eq('is_verified', true)
  if (filter === 'unverified') query = query.eq('is_verified', false)
  if (filter === 'suspended') query = query.eq('is_active', false)

  const { data: organisers, count } = await query
  const totalPages = Math.ceil((count || 0) / pageSize)

  // Get event counts per organiser
  const organiserIds = organisers?.map(o => o.id) || []
  const { data: eventCounts } = await adminClient
    .from('events')
    .select('organiser_id')
    .in('organiser_id', organiserIds)

  const eventCountMap: Record<string, number> = {}
  eventCounts?.forEach(e => {
    eventCountMap[e.organiser_id] = (eventCountMap[e.organiser_id] || 0) + 1
  })

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
            Organisers Management
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
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Organisers</h1>
            <p className="text-sm text-gray-500">{count?.toLocaleString() || 0} total organisers registered</p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <form className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full flex-1 max-w-md focus-within:border-orange-400 transition-all">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by org name, email or contact..."
              className="bg-transparent border-none outline-none text-sm text-gray-900 w-full placeholder:text-gray-400"
            />
          </form>
          <div className="flex gap-2">
            {[
              { label: 'All', value: 'all' },
              { label: 'Verified', value: 'verified' },
              { label: 'Unverified', value: 'unverified' },
              { label: 'Suspended', value: 'suspended' },
            ].map(({ label, value }) => (
              <Link key={value}
                href={`/admin/dashboard/organisers?filter=${value}${search ? `&search=${search}` : ''}`}
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

        {/* Organisers grid */}
        {organisers && organisers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {organisers.map((org) => (
              <div key={org.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                      {org.org_name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900">{org.org_name}</div>
                      <div className="text-xs text-gray-500">{org.contact_name}</div>
                      <div className="text-xs text-gray-400">{org.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      org.is_verified
                        ? 'bg-green-50 text-green-600 border-green-200'
                        : 'bg-orange-50 text-orange-500 border-orange-200'
                    }`}>
                      {org.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                    {!org.is_active && (
                      <span className="px-2.5 py-1 bg-red-50 text-red-500 border border-red-200 rounded-full text-xs font-bold">
                        Suspended
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { icon: Ticket, label: 'Events', value: eventCountMap[org.id] || 0 },
                    { icon: DollarSign, label: 'Revenue', value: '—' },
                    { icon: Calendar, label: 'Joined', value: org.created_at ? new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="p-2.5 bg-gray-50 rounded-xl text-center">
                      <Icon className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
                      <div className="text-xs font-bold text-gray-900">{value}</div>
                      <div className="text-xs text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Event types */}
                {org.organiser_event_types && org.organiser_event_types.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {org.organiser_event_types.slice(0, 4).map((t: { event_type: string }) => (
                      <span key={t.event_type} className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                        {t.event_type}
                      </span>
                    ))}
                    {org.organiser_event_types.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-xs font-semibold rounded-full">
                        +{org.organiser_event_types.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {org.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{org.description}</p>
                )}

                {/* Location */}
                {(org.city || org.state) && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                    <MapPin className="w-3 h-3" />
                    {org.city}{org.state ? `, ${org.state}` : ''}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
                  <Link href={`/admin/dashboard/organisers/${org.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:border-gray-300 transition-colors flex-1 justify-center">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </Link>

                  {!org.is_verified && (
                    <form action={`/api/admin/organisers/${org.id}/verify`} method="POST" className="flex-1">
                      <button type="submit"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" /> Verify
                      </button>
                    </form>
                  )}

                  {org.is_verified && org.is_active && (
                    <form action={`/api/admin/organisers/${org.id}/suspend`} method="POST" className="flex-1">
                      <button type="submit"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Suspend
                      </button>
                    </form>
                  )}

                  {!org.is_active && (
                    <form action={`/api/admin/organisers/${org.id}/restore`} method="POST" className="flex-1">
                      <button type="submit"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" /> Restore
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-400 mb-1">No organisers found</p>
            <p className="text-xs text-gray-400">
              {search ? 'Try a different search term' : 'No organisers have signed up yet'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500">
              Showing {offset + 1}–{Math.min(offset + pageSize, count || 0)} of {count?.toLocaleString()} organisers
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/admin/dashboard/organisers?page=${page - 1}${search ? `&search=${search}` : ''}${filter !== 'all' ? `&filter=${filter}` : ''}`}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <Link key={pageNum}
                    href={`/admin/dashboard/organisers?page=${pageNum}${search ? `&search=${search}` : ''}${filter !== 'all' ? `&filter=${filter}` : ''}`}
                    className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors flex items-center justify-center ${
                      pageNum === page
                        ? 'bg-gray-900 border-gray-900 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {pageNum}
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link href={`/admin/dashboard/organisers?page=${page + 1}${search ? `&search=${search}` : ''}${filter !== 'all' ? `&filter=${filter}` : ''}`}
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