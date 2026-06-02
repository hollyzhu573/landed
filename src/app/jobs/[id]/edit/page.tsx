import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import type { Job } from '@/src/lib/types'
import JobNotePage from './_components/JobNotePage'

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single<Job>()

  if (!job) notFound()

  return <JobNotePage job={job} />
}
