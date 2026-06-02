import { createClient } from '@/src/lib/supabase/server'
import type { QuestionBankEntry } from '@/src/lib/types'
import QuestionBankClient from './_components/QuestionBankClient'

export default async function PrepPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('question_bank')
    .select('*')
    .order('sort_order', { ascending: true })
    .returns<QuestionBankEntry[]>()

  if (error) throw new Error(error.message)

  return <QuestionBankClient initialQuestions={data ?? []} />
}
