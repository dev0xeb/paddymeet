import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: organiser } = await supabase
    .from('organisers')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!organiser) return NextResponse.json({ error: 'Organiser not found' }, { status: 404 })

  return NextResponse.json({ organiser })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const allowedFields = [
    'org_name', 'contact_name', 'phone', 'description', 'website', 'social_link',
    'bank_code', 'bank_name', 'account_number', 'account_name',
  ]

  const updates: Record<string, string> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  // Re-verify bank details against Paystack here, server-side, whenever
  // they're being changed — the settings UI only saves after its own call
  // to /verify-bank, but a direct call to this endpoint could set any
  // account_name regardless of whether it actually matches
  // account_number/bank_code, defeating that check entirely. Paystack's own
  // resolved name is used below, never the client-supplied one.
  if (updates.bank_code || updates.account_number) {
    if (!updates.bank_code || !updates.account_number) {
      return NextResponse.json({ error: 'Both bank and account number are required to update bank details.' }, { status: 400 })
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${updates.account_number}&bank_code=${updates.bank_code}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    )
    const verifyData = await verifyRes.json()

    if (!verifyData.status) {
      return NextResponse.json({ error: 'Could not verify this bank account. Please check the details.' }, { status: 400 })
    }

    updates.account_name = verifyData.data.account_name
  }

  const { error } = await supabase
    .from('organisers')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('Organiser profile update failed:', error.message)
    return NextResponse.json({ error: 'Could not save your changes. Please try again.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}