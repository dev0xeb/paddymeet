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
  const { organiser_id, amount, orders_count, payment_method, payment_reference, note } = body

  if (!organiser_id || !amount || !payment_reference) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: payout, error } = await adminClient
    .from('payouts')
    .insert({
      organiser_id,
      amount,
      orders_count,
      status: 'paid',
      payment_method: payment_method || 'bank_transfer',
      payment_reference,
      note: note || null,
      paid_by: user.id,
      paid_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Notify organiser
  await adminClient.from('notifications').insert({
    user_id: organiser_id,
    title: 'Payout processed 💰',
    message: `Your payout of ₦${amount.toLocaleString()} has been processed via ${payment_method || 'bank transfer'}. Reference: ${payment_reference}`,
    type: 'payout',
    is_read: false,
  })

  return NextResponse.json({ success: true, payout })
}