import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
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

    const body = await request.json()
    const { reason } = body

    // Mandatory rejection reason validation
    if (!reason?.trim()) {
      return NextResponse.json({
        error: 'A mandatory rejection reason must be provided to explain the decision to the customer.'
      }, { status: 400 })
    }

    // 1. Fetch refund request
    const { data: refundReq, error: reqError } = await adminClient
      .from('refund_requests')
      .select('*, events(title), users(email, full_name)')
      .eq('id', id)
      .single()

    if (reqError || !refundReq) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 })
    }

    // 2. Update refund request status and store explanatory note
    await adminClient
      .from('refund_requests')
      .update({
        status: 'rejected',
        admin_note: reason.trim(),
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id)

    // 3. Notify customer with mandatory explanation
    const eventObj = Array.isArray(refundReq.events) ? refundReq.events[0] : refundReq.events

    if (refundReq.user_id) {
      await adminClient.from('notifications').insert({
        user_id: refundReq.user_id,
        title: 'Refund Request Update',
        message: `Your refund request for "${eventObj?.title || 'Event'}" was not approved. Reason: ${reason.trim()}`,
        type: 'refund',
        is_read: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Refund request rejected with explanation provided to the customer.',
    })
  } catch (error) {
    console.error('Refund rejection error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
