import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin-login')
  }

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('id, full_name, department')
    .eq('id', user.id)
    .single()

  if (!admin) {
    redirect('/admin-login')
  }

  // Same counts the sidebar's Events/Organisers badges and the bell icon
  // need — fetched once here so every admin page gets a persistent,
  // consistently-populated sidebar instead of each page building (or, as
  // every page but the dashboard itself did, NOT building) its own.
  const [{ count: pendingEventsCount }, { count: pendingOrganisersCount }] = await Promise.all([
    adminClient.from('events').select('*', { count: 'exact', head: true }).eq('is_approved', false).eq('is_rejected', false),
    adminClient.from('organisers').select('*', { count: 'exact', head: true }).eq('is_verified', false),
  ])

  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      <AdminSidebar
        fullName={admin.full_name || 'Admin'}
        department={admin.department}
        pendingEventsCount={pendingEventsCount ?? 0}
        pendingOrganisersCount={pendingOrganisersCount ?? 0}
      />
      <div className="flex pt-16">
        <main className="md:ml-56 flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}