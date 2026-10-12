import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { code } = body

  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

  const { data: promo, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !promo) {
    return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 })
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This promo code has expired' }, { status: 400 })
  }

  // max_uses is intentionally nullable (an "unlimited uses" code) — without
  // this guard, `promo.uses_count >= promo.max_uses` evaluates `0 >= null`
  // as true (JS coerces null to 0 in a numeric comparison), so every
  // unlimited-use code was rejected as "reached its usage limit" on the
  // very first attempt, before ever actually being used.
  if (promo.max_uses && promo.uses_count >= promo.max_uses) {
    return NextResponse.json({ error: 'This promo code has reached its usage limit' }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    code: promo.code,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
  })
}