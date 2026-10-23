import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import JobDetailClient from '@/components/careers/JobDetailClient'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: opening } = await supabase
    .from('job_openings')
    .select('*, job_application_fields(*)')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!opening) notFound()

  const fields = (opening.job_application_fields || []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  )

  return <JobDetailClient opening={opening} fields={fields} />
}
