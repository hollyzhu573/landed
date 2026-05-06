'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import type { PrepCategory, PrepSection } from '@/src/lib/types'

export async function createPrepSection(
  jobId: string,
  category: PrepCategory,
  sortOrder: number,
): Promise<PrepSection> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('interview_prep')
    .insert({ job_id: jobId, category, answer: '', sort_order: sortOrder })
    .select()
    .single<PrepSection>()
  if (error) throw new Error(error.message)
  revalidatePath(`/jobs/${jobId}/edit`)
  return data
}

export async function updatePrepSectionNote(id: string, freeformNote: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('interview_prep')
    .update({ freeform_note: freeformNote, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updatePrepSectionDate(id: string, interviewDate: string | null): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('interview_prep')
    .update({ interview_date: interviewDate, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updatePrepSection(id: string, answer: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('interview_prep')
    .update({ answer, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deletePrepSection(id: string, jobId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('interview_prep').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/jobs/${jobId}/edit`)
}
