'use server'

import { createClient } from '@/src/lib/supabase/server'
import type { JobPrepQuestion, PrepCategory } from '@/src/lib/types'

export async function createJobPrepQuestions(
  jobId: string,
  questions: { question: string; category: PrepCategory; rationale: string | null }[],
): Promise<JobPrepQuestion[]> {
  const supabase = await createClient()

  const { data: last } = await supabase
    .from('job_prep_questions')
    .select('sort_order')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const baseOrder = last ? last.sort_order + 1 : 0

  const rows = questions.map((q, i) => ({
    job_id:     jobId,
    question:   q.question,
    answer:     '',
    category:   q.category,
    rationale:  q.rationale,
    sort_order: baseOrder + i,
  }))

  const { data, error } = await supabase
    .from('job_prep_questions')
    .insert(rows)
    .select()
    .returns<JobPrepQuestion[]>()

  if (error) throw new Error(error.message)
  return data
}

export async function updateJobPrepAnswer(id: string, answer: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('job_prep_questions')
    .update({ answer, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteJobPrepQuestion(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('job_prep_questions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
