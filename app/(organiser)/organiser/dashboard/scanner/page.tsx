import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import OrganiserNav from '@/components/OrganiserNav'
import QRScanner from '@/components/organiser/QRScanner'

export default async function ScannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id, org_name')
    .eq('id', user.id)
    .single()

  if (!organiser) redirect('/dashboard')

  // Get organiser's live events for selection
  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date, venue_name')
    .eq('organiser_id', user.id)
    .eq('is_approved', true)
    .eq('is_live', true)
    .order('event_date', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganiserNav orgName={organiser.org_name} />
      <div className="pt-16 max-w-2xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Ticket Scanner</h1>
          <p className="text-sm text-gray-500">Scan attendee QR codes to validate and check in tickets at the door.</p>
        </div>
        <QRScanner events={events || []} />
      </div>
    </div>
  )
}