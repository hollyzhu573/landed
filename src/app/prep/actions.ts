'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import type { PrepCategory, QuestionBankEntry } from '@/src/lib/types'

export async function createQuestion(category: PrepCategory | null = null): Promise<QuestionBankEntry> {
  const supabase = await createClient()
  const { data: last } = await supabase
    .from('question_bank')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sortOrder = last ? last.sort_order + 1 : 0

  const { data, error } = await supabase
    .from('question_bank')
    .insert({ question: '', answer: '', category: category ?? null, sort_order: sortOrder })
    .select()
    .single<QuestionBankEntry>()

  if (error) throw new Error(error.message)
  revalidatePath('/prep')
  return data
}

export async function updateQuestion(id: string, question: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('question_bank')
    .update({ question, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateAnswer(id: string, answer: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('question_bank')
    .update({ answer, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateSource(id: string, source: string | null): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('question_bank')
    .update({ source, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateCategory(id: string, category: PrepCategory | null): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('question_bank')
    .update({ category, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteQuestion(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('question_bank').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/prep')
}
