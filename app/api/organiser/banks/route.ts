import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://api.paystack.co/bank?currency=NGN&perPage=100', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    const data = await res.json()

    if (!data.status) {
      return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 400 })
    }

    return NextResponse.json({ banks: data.data })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 })
  }
}