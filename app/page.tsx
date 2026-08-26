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

  return (
    <>
      <LandingClientPage user={user} profile={profile} />
      <SupportChat accountType="explorer" />
    </>
  )
}