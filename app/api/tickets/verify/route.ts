import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { reference, event_id, ticket_type_id, quantity, user_id } = body

  // Verify payment with Paystack
  const verifyResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  )

  const verifyData = await verifyResponse.json()

  if (!verifyData.status || verifyData.data.status !== 'success') {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
  }

  const amountPaid = verifyData.data.amount / 100 // Paystack returns amount in kobo

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id,
      event_id,
      amount: amountPaid,
      service_fee: Math.round(amountPaid * 0.05),
      total_paid: amountPaid,
      payment_method: 'paystack',
      payment_reference: reference,
      payment_status: 'completed',
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 400 })
  }

  // Create tickets
  const tickets = []
  for (let i = 0; i < quantity; i++) {
    tickets.push({
      ticket_type_id,
      event_id,
      user_id,
      ticket_code: `PM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: 'active',
    })
  }

  const { data: createdTickets, error: ticketError } = await supabase
    .from('tickets')
    .insert(tickets)
    .select()

  if (ticketError) {
    return NextResponse.json({ error: ticketError.message }, { status: 400 })
  }

  // Update quantity sold
  await supabase.rpc('increment_tickets_sold', {
    ticket_type_id,
    amount: quantity,
  })

  // Create notification for user
  await supabase
    .from('notifications')
    .insert({
      user_id,
      title: 'Ticket confirmed!',
      message: `Your ticket has been confirmed. Check your dashboard to view it.`,
      type: 'ticket',
      is_read: false,
    })

  return NextResponse.json({
    success: true,
    order_id: order.id,
    tickets: createdTickets,
  })
}