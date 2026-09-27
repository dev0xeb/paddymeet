import SupportChat from '@/components/SupportChat'
import { createClient } from '@/lib/supabase-server'
import LandingClientPage from '@/components/landing/LandingClientPage'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('users')
        .select('username, tier, trust_score')
        .eq('id', user.id)
        .single()
    : { data: null }

  // Same account-type resolution the login page uses: metadata first, then
  // fall back to checking the organisers table — needed so the logged-in
  // nav state on the homepage routes an organiser to their own dashboard
  // instead of the explorer one.
  let accountType: 'explorer' | 'organiser' | null = null
  if (user) {
    accountType = (user.user_metadata?.account_type as 'explorer' | 'organiser' | undefined) || null
    if (!accountType) {
      const { data: org } = await supabase.from('organisers').select('id').eq('id', user.id).maybeSingle()
      accountType = org ? 'organiser' : 'explorer'
    }
  }

  // Fetch real upcoming events in PaddyMeet — once an event's date has
  // passed it has nothing left to sell and shouldn't keep showing here.
  const today = new Date().toISOString().split('T')[0]
  const { data: eventsRaw } = await supabase
    .from('events')
    .select('id, title, event_type, city, state, event_date, vibe, is_free, cover_image_url, venue_name, start_time, ticket_types(price)')
    .eq('is_approved', true)
    .eq('is_live', true)
    .gte('event_date', today)
    .order('is_featured', { ascending: false })
    .order('event_date', { ascending: true })
    .limit(12)

  return (
    <>
      <LandingClientPage
        user={user}
        profile={profile}
        accountType={accountType}
        liveEvents={eventsRaw || []}
      />
      <SupportChat accountType="explorer" />
    </>
  )
}