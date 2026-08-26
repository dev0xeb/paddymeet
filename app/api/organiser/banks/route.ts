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

    const rawBanks = Array.isArray(data.data) ? data.data : []
    const seenCodes = new Set<string>()
    const uniqueBanks = rawBanks.filter((bank: { code: string; name: string }) => {
      if (!bank.code || seenCodes.has(bank.code)) return false
      seenCodes.add(bank.code)
      return true
    })

    return NextResponse.json({ banks: uniqueBanks })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 })
  }
}