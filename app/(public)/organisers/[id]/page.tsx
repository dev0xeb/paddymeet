import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Globe, BadgeCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Logo from '@/components/brand/Logo'
import FollowOrganiserButton from '@/components/FollowOrganiserButton'
import EventsResults from '@/components/events/EventsResults'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const adminClient = createAdminClient()
  const { data: organiser } = await adminClient
    .from('organisers')
    .select('org_name, description')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()

  if (!organiser) return { title: 'Organiser' }
  return {
    title: organiser.org_name,
    description: organiser.description || `Upcoming events from ${organiser.org_name} on Paddymeet.`,
  }
}

export default async function OrganiserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Public reads of organiser rows have no RLS policy, so this goes
  // through the admin client — same as the public careers listing.
  const { data: organiser } = await adminClient
    .from('organisers')
    .select('id, org_name, description, website, is_verified')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()

  if (!organiser) notFound()

  const { count: followerCount } = await adminClient
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('organiser_id', id)

  const { data: { user } } = await supabase.auth.getUser()
  let isFollowing = false
  if (user) {
    const { data: followRecord } = await adminClient
      .from('follows')
      .select('id')
      .eq('organiser_id', id)
      .eq('user_id', user.id)
      .limit(1)
    isFollowing = (followRecord?.length ?? 0) > 0
  }

  const today = new Date().toISOString().split('T')[0]
  const { data: events } = await adminClient
    .from('events')
    .select('*, ticket_types(*)')
    .eq('organiser_id', id)
    .eq('is_approved', true)
    .eq('is_live', true)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(24)

  const gradients = [
    'from-purple-900 via-pink-900 to-orange-900',
    'from-green-900 via-teal-900 to-blue-900',
    'from-indigo-900 via-purple-900 to-pink-900',
    'from-orange-900 via-red-900 to-pink-900',
    'from-blue-900 via-indigo-900 to-purple-900',
    'from-green-900 via-emerald-900 to-teal-900',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 md:px-10 bg-white border-b border-gray-100">
        <Link href="/" className="text-lg font-bold text-gray-900"><Logo variant="horizontal" tone="color" className="h-6 w-auto" /></Link>
      </nav>

      <div className="pt-24 max-w-5xl mx-auto px-6 md:px-10 pb-16">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mb-8 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0">
              {organiser.org_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight truncate">{organiser.org_name}</h1>
                {organiser.is_verified && (
                  <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0" aria-label="Verified organiser" />
                )}
              </div>
              {organiser.description && (
                <p className="text-sm text-gray-500 mt-1 max-w-xl">{organiser.description}</p>
              )}
              {organiser.website && (
                <a href={organiser.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline mt-2">
                  <Globe className="w-3.5 h-3.5" /> {organiser.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>

          <FollowOrganiserButton
            organiserId={organiser.id}
            organiserName={organiser.org_name}
            initialFollowing={isFollowing}
            initialCount={followerCount || 0}
            className="flex-shrink-0 self-start sm:self-center"
          />
        </div>

        <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4">Upcoming events</h2>
        <EventsResults events={events || []} gradients={gradients} hasActiveFilters={false} />
      </div>
    </div>
  )
}
