import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
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

    if (!admin || !['super_admin', 'marketing', 'operations', 'finance'].includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: codes, error } = await adminClient
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ codes: codes || [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    if (!admin || !['super_admin', 'marketing', 'operations'].includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, discount_type, discount_value, max_uses, expires_at } = body

    if (!code || !discount_value) {
      return NextResponse.json({ error: 'Code and discount value are required' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase()

    // Check duplicate
    const { data: existing } = await adminClient
      .from('promo_codes')
      .select('id')
      .eq('code', cleanCode)
      .single()

    if (existing) {
      return NextResponse.json({ error: `Promo code "${cleanCode}" already exists` }, { status: 400 })
    }

    const { data: newPromo, error: insertError } = await adminClient
      .from('promo_codes')
      .insert({
        code: cleanCode,
        discount_type: discount_type || 'percentage',
        discount_value: Number(discount_value),
        max_uses: max_uses ? Number(max_uses) : null,
        uses_count: 0,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, promo: newPromo })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
