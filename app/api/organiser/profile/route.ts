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
    'org_name', 'contact_name', 'phone', 'description',
    'website', 'social_link', 'bank_name', 'account_number', 'account_name'
  ]

  const updates: Record<string, string> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  const { error } = await supabase
    .from('organisers')
    .update(updates)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}