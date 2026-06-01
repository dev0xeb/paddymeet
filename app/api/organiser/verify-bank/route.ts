import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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