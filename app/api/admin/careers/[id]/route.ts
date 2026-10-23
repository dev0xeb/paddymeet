import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_DEPARTMENTS = ['super_admin', 'operations']

interface FieldInput {
  label: string
  field_type: 'text' | 'textarea'
  is_required: boolean
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { title, department, location, employment_type, pay, summary, description, is_published, fields } = body

    const updates: Record<string, string | boolean | null> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = title.trim()
    if (department !== undefined) updates.department = department?.trim() || null
    if (location !== undefined) updates.location = location?.trim() || null
    if (employment_type !== undefined) updates.employment_type = employment_type?.trim() || null
    if (pay !== undefined) updates.pay = pay?.trim() || null
    if (summary !== undefined) updates.summary = summary.trim()
    if (description !== undefined) updates.description = description.trim()
    if (is_published !== undefined) updates.is_published = Boolean(is_published)

    const { data: updated, error } = await adminClient
      .from('job_openings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fields are small per-role lists — replacing the set wholesale on
    // every edit is simpler and safer than diffing individual rows, and
    // doesn't touch anyone who already applied: job_applications stores a
    // full {label, value} snapshot of what it saw at submit time, not a
    // live reference to these rows.
    if (Array.isArray(fields)) {
      const { error: deleteError } = await adminClient
        .from('job_application_fields')
        .delete()
        .eq('job_opening_id', id)

      if (deleteError) {
        console.error('Job application fields delete failed:', deleteError.message)
      }

      const fieldList: FieldInput[] = fields
      if (fieldList.length > 0) {
        const { error: fieldsError } = await adminClient
          .from('job_application_fields')
          .insert(fieldList.map((f, i) => ({
            job_opening_id: id,
            label: f.label?.trim(),
            field_type: f.field_type === 'textarea' ? 'textarea' : 'text',
            is_required: f.is_required !== false,
            sort_order: i,
          })).filter(f => f.label))

        if (fieldsError) {
          console.error('Job application fields insert failed:', fieldsError.message)
        }
      }
    }

    return NextResponse.json({ success: true, opening: updated })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { error } = await adminClient
      .from('job_openings')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
