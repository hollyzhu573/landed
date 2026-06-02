'use client'

import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { createQuestion } from '../actions'
import QuestionCard from './QuestionCard'
import type { QuestionBankEntry } from '@/src/lib/types'

export default function QuestionBankClient({
  initialQuestions,
}: {
  initialQuestions: QuestionBankEntry[]
}) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [adding, setAdding]       = useState(false)
  const newIdRef                  = useRef<string | null>(null)

  async function handleAdd() {
    setAdding(true)
    try {
      const q = await createQuestion()
      newIdRef.current = q.id
      setQuestions(prev => [...prev, q])
    } finally {
      setAdding(false)
    }
  }

  function handleDelete(id: string) {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">Prep</h1>
          <p className="mt-1 font-mono text-[12px] text-zinc-400">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          <Plus size={14} />
          Add question
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-20 text-center">
          <p className="text-sm text-zinc-400">No questions yet.</p>
          <button
            onClick={handleAdd}
            className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2"
          >
            Add your first question
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {questions.map(q => (
            <QuestionCard
              key={q.id}
              entry={q}
              autoFocus={q.id === newIdRef.current}
              onDelete={() => handleDelete(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
