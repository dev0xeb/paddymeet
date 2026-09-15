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

    if (!admin || !['super_admin', 'finance'].includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch payout record with organiser bank details
    const { data: payout, error: payoutError } = await adminClient
      .from('payouts')
      .select('*, organisers(id, org_name, email, bank_code, bank_account_number, bank_account_name, bank_recipient_code)')
      .eq('id', id)
      .single()

    if (payoutError || !payout) {
      return NextResponse.json({ error: 'Payout record not found' }, { status: 404 })
    }

    // 2. LAYER 1 IDEMPOTENCY GUARD: Check if already paid or currently processing
    if (payout.status === 'paid') {
      return NextResponse.json(
        { error: 'This payout has already been successfully disbursed.', payment_reference: payout.payment_reference },
        { status: 409 }
      )
    }

    if (payout.status === 'processing') {
      return NextResponse.json(
        { error: 'This payout is currently being processed by the payment gateway. Duplicate transfer prevented.' },
        { status: 409 }
      )
    }

    const org = Array.isArray(payout.organisers) ? payout.organisers[0] : payout.organisers
    if (!org?.bank_account_number || !org?.bank_code) {
      return NextResponse.json(
        { error: 'Organiser has not configured valid bank account details.' },
        { status: 400 }
      )
    }

    // 3. LAYER 2 IDEMPOTENCY: guarded update — only succeeds if status is
    // still whatever we just read. A concurrent request (double-click, two
    // admin tabs) that already flipped it to 'processing' or 'paid' makes
    // this update match zero rows, so we stop here instead of both
    // requests going on to call Paystack.
    const { data: lockRows, error: lockError } = await adminClient
      .from('payouts')
      .update({ status: 'processing', note: 'Initiating bank disbursement via Paystack...' })
      .eq('id', id)
      .eq('status', payout.status)
      .select('id')

    if (lockError || !lockRows || lockRows.length === 0) {
      return NextResponse.json(
        { error: 'This payout is already being processed by another request. Duplicate transfer prevented.' },
        { status: 409 }
      )
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecret) {
      await adminClient.from('payouts').update({ status: 'failed', note: 'Missing PAYSTACK_SECRET_KEY' }).eq('id', id)
      return NextResponse.json({ error: 'Paystack secret key configuration missing.' }, { status: 500 })
    }

    // 4. Resolve or create Paystack Transfer Recipient Code (RCP_xxxx)
    let recipientCode = org.bank_recipient_code
    if (!recipientCode) {
      const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nuban',
          name: org.bank_account_name || org.org_name,
          account_number: org.bank_account_number,
          bank_code: org.bank_code,
          currency: 'NGN',
        }),
      })

      const recData = await recipientRes.json()
      if (!recData.status || !recData.data?.recipient_code) {
        const errMsg = recData.message || 'Failed to create Paystack transfer recipient.'
        await adminClient.from('payouts').update({ status: 'failed', note: errMsg }).eq('id', id)
        return NextResponse.json({ error: errMsg }, { status: 400 })
      }

      recipientCode = recData.data.recipient_code
      // Cache recipient code for future payouts
      await adminClient
        .from('organisers')
        .update({ bank_recipient_code: recipientCode })
        .eq('id', org.id)
    }

    // 5. LAYER 3 IDEMPOTENCY: Deterministic transfer reference
    const idempotentRef = `PM-PAYOUT-${payout.id}`
    const amountInKobo = Math.round(Number(payout.amount) * 100)

    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amountInKobo,
        recipient: recipientCode,
        reason: `PaddyMeet Event Settlement Payout #${payout.id.slice(0, 8)}`,
        reference: idempotentRef,
      }),
    })

    const transferData = await transferRes.json()

    if (!transferData.status) {
      const errMsg = transferData.message || 'Paystack transfer initiation failed.'
      await adminClient
        .from('payouts')
        .update({ status: 'failed', note: errMsg })
        .eq('id', id)
      return NextResponse.json({ error: errMsg }, { status: 400 })
    }

    const transferCode = transferData.data?.transfer_code || transferData.data?.reference || idempotentRef
    const paidAt = new Date().toISOString()

    // 6. Update payout record to 'paid'. The Paystack transfer has already
    // been initiated at this point — if this write fails, the payout is
    // left at 'processing' (which the Layer 1 guard above treats as
    // in-flight and blocks from being disbursed again), so log loudly for
    // manual reconciliation rather than silently losing track of it.
    const { error: markPaidError } = await adminClient
      .from('payouts')
      .update({
        status: 'paid',
        payment_method: 'paystack_transfer',
        payment_reference: transferCode,
        note: `Disbursed via Paystack (${transferCode})`,
        paid_by: user.id,
        paid_at: paidAt,
      })
      .eq('id', id)

    if (markPaidError) {
      console.error(`Payout ${id} was disbursed via Paystack (ref ${transferCode}) but failed to be marked 'paid' in the DB:`, markPaidError.message)
    }

    // 7. Notify organiser of successful disbursement
    if (payout.organiser_id) {
      await adminClient.from('notifications').insert({
        user_id: payout.organiser_id,
        title: 'Payout Disbursed 💰',
        message: `Your event payout of ₦${Number(payout.amount).toLocaleString()} has been sent to your bank account (${org.bank_account_number}). Ref: ${transferCode}`,
        type: 'payout',
        is_read: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully disbursed ₦${Number(payout.amount).toLocaleString()} to ${org.org_name}.`,
      transfer_code: transferCode,
      paid_at: paidAt,
    })
  } catch (error) {
    console.error('Payout disbursement error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
