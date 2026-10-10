import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Was reachable with no auth at all — anyone could use this as a free,
  // unrate-limited "resolve this account number to its owner's real name"
  // oracle, and burn the site's Paystack quota in the process. Not covered
  // by middleware (that only gates /organiser page routes, not /api/organiser/*).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { account_number, bank_code } = await request.json()

  if (!account_number || !bank_code) {
    return NextResponse.json({ error: 'Account number and bank code are required' }, { status: 400 })
  }

  if (account_number.length !== 10) {
    return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const data = await res.json()

    if (!data.status) {
      return NextResponse.json({ error: 'Could not verify account. Please check your details.' }, { status: 400 })
    }

    return NextResponse.json({
      account_name: data.data.account_name,
      account_number: data.data.account_number,
    })
  } catch {
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 })
  }
}