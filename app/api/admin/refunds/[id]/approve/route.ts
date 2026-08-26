import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendTicketEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: admin } = await adminClient
      .from('admin_team')
      .select('department')
      .eq('id', user.id)
      .single()

    if (!admin || !['super_admin', 'finance', 'operations', 'support'].includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch refund request
    const { data: refundReq, error: reqError } = await adminClient
      .from('refund_requests')
      .select('*, tickets(id, ticket_code, ticket_type_id, user_id, event_id), users(email, full_name), events(title)')
      .eq('id', id)
      .single()

    if (reqError || !refundReq) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 })
    }

    // 2. Mark refund as approved
    await adminClient
      .from('refund_requests')
      .update({
        status: 'approved',
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id)

    // 3. Invalidate ticket immediately
    if (refundReq.ticket_id) {
      await adminClient
        .from('tickets')
        .update({ status: 'refunded' })
        .eq('id', refundReq.ticket_id)

      // 4. Return seat to available capacity
      if (refundReq.tickets?.ticket_type_id) {
        const { data: tt } = await adminClient
          .from('ticket_types')
          .select('quantity_sold')
          .eq('id', refundReq.tickets.ticket_type_id)
          .single()

        if (tt) {
          await adminClient
            .from('ticket_types')
            .update({ quantity_sold: Math.max(0, (tt.quantity_sold || 1) - 1) })
            .eq('id', refundReq.tickets.ticket_type_id)
        }
      }
    }

    // 5. Notify customer
    const customerUser = Array.isArray(refundReq.users) ? refundReq.users[0] : refundReq.users
    const eventObj = Array.isArray(refundReq.events) ? refundReq.events[0] : refundReq.events

    if (refundReq.user_id) {
      await adminClient.from('notifications').insert({
        user_id: refundReq.user_id,
        title: 'Refund Approved 💰',
        message: `Your refund for "${eventObj?.title || 'Event'}" has been approved. The ticket QR code is now voided.`,
        type: 'refund',
        is_read: false,
      })
    }

    return NextResponse.json({ success: true, message: 'Refund approved and ticket voided.' })
  } catch (error) {
    console.error('Refund approval error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
