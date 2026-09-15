import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// Admin-session-gated trigger for the "Process Now" button on the admin
// dashboard. app/api/cron/process-group-deadlines/route.ts itself is gated
// by CRON_SECRET, a server-only env var — the dashboard button used to try
// to call it directly from the browser with NEXT_PUBLIC_CRON_SECRET, which
// was never defined (only the non-public CRON_SECRET exists), so every
// click just got a 401. This route re-authorizes the caller as an admin via
// their session, then forwards to the cron route server-side with the real
// secret, which never reaches the browser.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured on the server.' }, { status: 500 })
  }

  const res = await fetch(new URL('/api/cron/process-group-deadlines', request.nextUrl.origin), {
    method: 'GET',
    headers: { Authorization: `Bearer ${cronSecret}` },
  })
  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}
