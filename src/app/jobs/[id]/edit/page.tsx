import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import type { Job, PrepSection } from '@/src/lib/types'
import JobNotePage from './_components/JobNotePage'

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: job }, { data: sections }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', id).single<Job>(),
    supabase
      .from('interview_prep')
      .select('*')
      .eq('job_id', id)
      .order('sort_order', { ascending: true })
      .returns<PrepSection[]>(),
  ])

  if (!job) notFound()

  return <JobNotePage job={job} initialSections={sections ?? []} />
}
