import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_DEPARTMENTS = ['super_admin', 'operations']

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

    if (!admin || !ALLOWED_DEPARTMENTS.includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: openings, error } = await adminClient
      .from('job_openings')
      .select('*, job_application_fields(*)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Nested selects come back in insertion order, not sort_order — the
    // admin's field-ordering choice only matters visually once this is
    // actually sorted.
    const sorted = (openings || []).map(o => ({
      ...o,
      job_application_fields: (o.job_application_fields || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      ),
    }))

    return NextResponse.json({ openings: sorted })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

interface FieldInput {
  label: string
  field_type: 'text' | 'textarea'
  is_required: boolean
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

    if (!admin || !ALLOWED_DEPARTMENTS.includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, department, location, employment_type, pay, summary, description, fields } = body

    if (!title?.trim() || !summary?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title, summary, and description are required' }, { status: 400 })
    }

    const { data: opening, error: insertError } = await adminClient
      .from('job_openings')
      .insert({
        title: title.trim(),
        department: department?.trim() || null,
        location: location?.trim() || null,
        employment_type: employment_type?.trim() || null,
        pay: pay?.trim() || null,
        summary: summary.trim(),
        description: description.trim(),
        is_published: false,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const fieldList: FieldInput[] = Array.isArray(fields) ? fields : []
    if (fieldList.length > 0) {
      const { error: fieldsError } = await adminClient
        .from('job_application_fields')
        .insert(fieldList.map((f, i) => ({
          job_opening_id: opening.id,
          label: f.label?.trim(),
          field_type: f.field_type === 'textarea' ? 'textarea' : 'text',
          is_required: f.is_required !== false,
          sort_order: i,
        })).filter(f => f.label))

      if (fieldsError) {
        console.error('Job application fields insert failed:', fieldsError.message)
      }
    }

    return NextResponse.json({ success: true, opening })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
