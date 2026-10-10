import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

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

  if (!admin || !['super_admin', 'finance'].includes(admin.department)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { organiser_id, amount, orders_count, note } = body

  if (!organiser_id || !(Number(amount) > 0)) {
    return NextResponse.json({ error: 'organiser_id and a positive amount are required' }, { status: 400 })
  }

  const { data: organiser } = await adminClient
    .from('organisers')
    .select('id')
    .eq('id', organiser_id)
    .single()

  if (!organiser) {
    return NextResponse.json({ error: 'Organiser not found' }, { status: 404 })
  }

  const { data: payout, error } = await adminClient
    .from('payouts')
    .insert({
      organiser_id,
      amount,
      orders_count,
      status: 'hold',
      note: note || null,
      paid_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Notify organiser
  await adminClient.from('notifications').insert({
    user_id: organiser_id,
    title: 'Payout on hold',
    message: `Your payout of ₦${amount.toLocaleString()} has been placed on hold.${note ? ` Reason: ${note}` : ' Please contact support for more information.'}`,
    type: 'payout',
    is_read: false,
  })

  return NextResponse.json({ success: true, payout })
}