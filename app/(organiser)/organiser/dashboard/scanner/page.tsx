import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import OrganiserNav from '@/components/OrganiserNav'
import QRScanner from '@/components/organiser/QRScanner'

export default async function ScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id, org_name')
    .eq('id', user.id)
    .single()

  if (!organiser) redirect('/login')

  // Get organiser's live, not-yet-ended events for selection — is_live
  // never gets turned off once an event's date passes, so without the
  // event_date filter this list kept offering events that already
  // happened to scan tickets against.
  const today = new Date().toISOString().split('T')[0]
  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date, venue_name')
    .eq('organiser_id', user.id)
    .eq('is_approved', true)
    .eq('is_live', true)
    .gte('event_date', today)
    .order('event_date', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganiserNav orgName={organiser.org_name} />
      <div className="pt-16 max-w-2xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Ticket Scanner</h1>
          <p className="text-sm text-gray-500">Scan attendee QR codes to validate and check in tickets at the door.</p>
        </div>
        <QRScanner events={events || []} initialCode={code} />
      </div>
    </div>
  )
}