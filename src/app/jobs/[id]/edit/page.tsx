import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import type { Job, JobPrepQuestion, QuestionBankEntry } from '@/src/lib/types'
import JobNotePage from './_components/JobNotePage'

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: job }, { data: prepQuestions }, { data: bankQuestions }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', id).single<Job>(),
    supabase
      .from('job_prep_questions')
      .select('*')
      .eq('job_id', id)
      .order('sort_order', { ascending: true })
      .returns<JobPrepQuestion[]>(),
    supabase
      .from('question_bank')
      .select('question, category')
      .order('sort_order', { ascending: true })
      .returns<Pick<QuestionBankEntry, 'question' | 'category'>[]>(),
  ])

  if (!job) notFound()

  return (
    <JobNotePage
      job={job}
      prepQuestions={prepQuestions ?? []}
      bankQuestions={(bankQuestions ?? []).filter(q => q.question.trim())}
    />
  )
}
