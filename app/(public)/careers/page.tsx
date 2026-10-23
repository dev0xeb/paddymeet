import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import CareersPageClient from '@/components/careers/CareersPageClient'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the Paddymeet team and help build Nigeria\'s nightlife platform.',
}

export default async function CareersPage() {
  const supabase = await createClient()

  const { data: openings } = await supabase
    .from('job_openings')
    .select('id, title, department, location, employment_type, pay, summary, description')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return <CareersPageClient openings={openings || []} />
}
