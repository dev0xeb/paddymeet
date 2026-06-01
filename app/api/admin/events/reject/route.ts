import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('admin_team')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('events')
    .update({ is_approved: false, is_live: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.redirect(new URL('/admin/dashboard', request.url))
}