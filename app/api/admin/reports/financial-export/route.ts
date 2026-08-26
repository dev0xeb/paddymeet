import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: admin } = await adminClient
      .from('admin_team')
      .select('department')
      .eq('id', user.id)
      .single()

    if (!admin || !['super_admin', 'finance', 'operations'].includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const eventId = searchParams.get('eventId')
    const status = searchParams.get('status')
    const preset = searchParams.get('preset')

    let query = adminClient
      .from('orders')
      .select('id, payment_reference, amount, service_fee, total_paid, payment_status, discount_applied, promo_code_used, buyer_name, buyer_phone, created_at, events(id, title, organiser_id, organisers(org_name))')
      .order('created_at', { ascending: false })

    // Date filtering
    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString())
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      query = query.lte('created_at', end.toISOString())
    }

    if (preset === 'today') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      query = query.gte('created_at', startOfDay.toISOString())
    } else if (preset === 'this_week') {
      const startOfWeek = new Date()
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Monday
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)
      query = query.gte('created_at', startOfWeek.toISOString())
    } else if (preset === 'this_month') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      query = query.gte('created_at', startOfMonth.toISOString())
    } else if (preset === 'last_30_days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query = query.gte('created_at', thirtyDaysAgo.toISOString())
    }

    // Event filter
    if (eventId && eventId !== 'all') {
      query = query.eq('event_id', eventId)
    }

    // Status filter
    if (status && status !== 'all') {
      query = query.eq('payment_status', status)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    const headers = [
      'Order ID',
      'Payment Reference',
      'Event Title',
      'Organiser Name',
      'Buyer Name',
      'Buyer Phone',
      'Ticket Subtotal (NGN)',
      'Platform Fee (NGN)',
      'Total Paid (NGN)',
      'Discount %',
      'Promo Code',
      'Payment Status',
      'Transaction Date & Time',
    ]

    const escape = (val: string | number | null | undefined) => `"${String(val || '').replace(/"/g, '""')}"`

    const rows = (orders || []).map(o => {
      const ev = Array.isArray(o.events) ? o.events[0] : o.events
      const organisers = ev?.organisers as unknown as { org_name?: string } | { org_name?: string }[] | undefined
      const orgName = Array.isArray(organisers) ? organisers[0]?.org_name : organisers?.org_name

      return [
        escape(o.id),
        escape(o.payment_reference),
        escape(ev?.title || 'Unknown Event'),
        escape(orgName || 'Platform Host'),
        escape(o.buyer_name || '—'),
        escape(o.buyer_phone || '—'),
        o.amount || 0,
        o.service_fee || 0,
        o.total_paid || 0,
        o.discount_applied || 0,
        escape(o.promo_code_used || '—'),
        escape(o.payment_status || 'completed'),
        escape(o.created_at ? new Date(o.created_at).toLocaleString('en-GB') : '—'),
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\r\n')
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `financial_report_${eventId && eventId !== 'all' ? 'event_' : ''}${timestamp}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Financial export error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
