import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function OrganiserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Being logged in only proves there's SOME valid account behind this
  // session — an explorer or admin session passes that check too. Every
  // page under here assumes the caller is specifically an organiser, so
  // that has to be verified here, once, rather than trusted to each page
  // (several of them currently skip this and lean entirely on their own
  // API routes re-checking it).
  const { data: organiser } = await supabase
    .from('organisers')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!organiser) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}