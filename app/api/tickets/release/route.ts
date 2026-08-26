import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reservation_id } = body

    if (!reservation_id || reservation_id.startsWith('res-soft-')) {
      return NextResponse.json({ success: true, released: false })
    }

    const adminClient = createAdminClient()

    await adminClient
      .from('ticket_reservations')
      .update({ status: 'released' })
      .eq('id', reservation_id)
      .eq('status', 'pending')

    return NextResponse.json({ success: true, released: true })
  } catch (error) {
    console.error('Release reservation error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
