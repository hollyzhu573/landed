'use client'

import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { createQuestion } from '../actions'
import QuestionCard from './QuestionCard'
import type { PrepCategory, QuestionBankEntry } from '@/src/lib/types'

const TABS: { value: PrepCategory | 'all'; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'portfolio',  label: 'Portfolio' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'technical',  label: 'Technical' },
  { value: 'other',      label: 'Other' },
]

const CATEGORY_DOT: Record<PrepCategory, string> = {
  behavioral: 'bg-zinc-400',
  portfolio:  'bg-violet-400',
  case_study: 'bg-amber-400',
  technical:  'bg-sky-400',
  other:      'bg-zinc-300',
}

const CATEGORY_ACTIVE: Record<PrepCategory, { border: string; badge: string }> = {
  behavioral: { border: 'border-zinc-800',   badge: 'bg-zinc-800 text-white' },
  portfolio:  { border: 'border-violet-500', badge: 'bg-violet-500 text-white' },
  case_study: { border: 'border-amber-500',  badge: 'bg-amber-500 text-white' },
  technical:  { border: 'border-sky-500',    badge: 'bg-sky-500 text-white' },
  other:      { border: 'border-zinc-500',   badge: 'bg-zinc-500 text-white' },
}

export default function QuestionBankClient({
  initialQuestions,
}: {
  initialQuestions: QuestionBankEntry[]
}) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [activeTab, setActiveTab] = useState<PrepCategory | 'all'>('all')
  const [adding,    setAdding]    = useState(false)
  const newIdRef = useRef<string | null>(null)

  const visible = activeTab === 'all'
    ? questions
    : questions.filter(q => q.category === activeTab)

  async function handleAdd() {
    setAdding(true)
    try {
      const q = await createQuestion(activeTab === 'all' ? 'other' : activeTab)
      newIdRef.current = q.id
      setQuestions(prev => [...prev, q])
    } finally {
      setAdding(false)
    }
  }

  function handleDelete(id: string) {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  function handleCategoryChange(id: string, category: PrepCategory | null) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, category } : q))
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
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

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-0 border-b border-zinc-100">
        {TABS.map(tab => {
          const count = tab.value === 'all'
            ? questions.length
            : questions.filter(q => q.category === tab.value).length
          if (tab.value !== 'all' && count === 0) return null

          const isActive = activeTab === tab.value
          const colors = tab.value !== 'all' ? CATEGORY_ACTIVE[tab.value] : null

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
                isActive
                  ? (colors ? `${colors.border} text-zinc-900` : 'border-zinc-900 text-zinc-900')
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {tab.value !== 'all' && (
                <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[tab.value]} ${isActive ? 'opacity-100' : 'opacity-60'}`} />
              )}
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                  isActive && colors
                    ? colors.badge
                    : isActive
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Question list */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-20 text-center">
          <p className="text-sm text-zinc-400">
            {activeTab === 'all'
              ? 'No questions yet.'
              : `No ${TABS.find(t => t.value === activeTab)?.label} questions yet.`}
          </p>
          <button
            onClick={handleAdd}
            className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2"
          >
            Add one
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map(q => (
            <QuestionCard
              key={q.id}
              entry={q}
              autoFocus={q.id === newIdRef.current}
              onDelete={() => handleDelete(q.id)}
              onCategoryChange={(category) => handleCategoryChange(q.id, category)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
