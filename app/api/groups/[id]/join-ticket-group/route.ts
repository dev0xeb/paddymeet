import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*, ticket_types(*)')
    .eq('id', groupId)
    .single()

  if (groupError || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  if (group.status !== 'recruiting') {
    return NextResponse.json({ error: 'This group is no longer accepting new members' }, { status: 400 })
  }

  if (group.payment_deadline && new Date(group.payment_deadline) < new Date()) {
    return NextResponse.json({ error: 'Sign-ups for this group have closed' }, { status: 400 })
  }

  // Check current paid member count
  const { count: paidCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('payment_status', 'paid')

  const remainingSpots = group.max_members - (paidCount ?? 0)

  if (remainingSpots <= 0) {
    return NextResponse.json({ error: 'This group is already full' }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    amount_per_member: group.amount_per_member,
    needs_payment: group.amount_per_member > 0,
    remaining_spots: remainingSpots,
  })
}