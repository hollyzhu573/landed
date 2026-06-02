'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown, ChevronRight, Trash2, Check } from 'lucide-react'
import { updateQuestion, updateAnswer, updateSource, deleteQuestion } from '../actions'
import type { QuestionBankEntry } from '@/src/lib/types'

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

export default function QuestionCard({
  entry,
  autoFocus,
  onDelete,
}: {
  entry: QuestionBankEntry
  autoFocus?: boolean
  onDelete: () => void
}) {
  const [question, setQuestion] = useState(entry.question)
  const [answer, setAnswer]     = useState(entry.answer)
  const [source, setSource]     = useState(entry.source ?? '')
  const [expanded, setExpanded] = useState(!entry.answer)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hovered, setHovered]   = useState(false)
  const [editingSource, setEditingSource] = useState(false)

  const questionRef = useRef<HTMLTextAreaElement>(null)
  const answerRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && questionRef.current) {
      questionRef.current.focus()
      setExpanded(true)
    }
  }, [autoFocus])

  // Resize question textarea on mount
  useEffect(() => {
    if (questionRef.current) autoResize(questionRef.current)
  }, [])

  // Resize answer textarea when expanded
  useEffect(() => {
    if (expanded && answerRef.current) autoResize(answerRef.current)
  }, [expanded])

  const saveAnswer = useCallback(async (value: string) => {
    setSaveState('saving')
    try {
      await updateAnswer(entry.id, value)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }, [entry.id])

  // Debounced autosave — answer
  useEffect(() => {
    if (answer === entry.answer) return
    const t = setTimeout(() => saveAnswer(answer), 800)
    return () => clearTimeout(t)
  }, [answer, entry.answer, saveAnswer])

  // Debounced autosave — question
  useEffect(() => {
    if (question === entry.question) return
    const t = setTimeout(() => updateQuestion(entry.id, question), 800)
    return () => clearTimeout(t)
  }, [question, entry.question, entry.id])

  // Debounced autosave — source
  useEffect(() => {
    const existing = entry.source ?? ''
    if (source === existing) return
    const t = setTimeout(() => updateSource(entry.id, source || null), 800)
    return () => clearTimeout(t)
  }, [source, entry.source, entry.id])

  async function handleDelete() {
    try {
      await deleteQuestion(entry.id)
      onDelete()
    } catch {
      // stay in UI on error
    }
  }

  return (
    <div
      className="group rounded-xl border border-zinc-100 bg-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start gap-2 px-4 pt-3 pb-2">
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-[3px] shrink-0 text-zinc-300 transition-colors hover:text-zinc-500"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="min-w-0 flex-1">
          <textarea
            ref={questionRef}
            value={question}
            onChange={e => {
              setQuestion(e.target.value)
              autoResize(e.target)
            }}
            rows={1}
            placeholder="What's the question?"
            className="w-full resize-none overflow-hidden bg-transparent text-[14px] font-medium leading-snug text-zinc-800 placeholder:text-zinc-300 focus:outline-none"
          />

          {/* Source */}
          <div className="mt-0.5 h-4">
            {editingSource ? (
              <input
                autoFocus
                value={source}
                onChange={e => setSource(e.target.value)}
                onBlur={() => setEditingSource(false)}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                placeholder="Source (e.g. Google loop, Figma, Blind)"
                className="w-full bg-transparent text-[11px] text-zinc-400 placeholder:text-zinc-300 focus:outline-none"
              />
            ) : source ? (
              <button
                onClick={() => setEditingSource(true)}
                className="text-[11px] text-zinc-400 hover:text-zinc-600"
              >
                {source}
              </button>
            ) : (
              <button
                onClick={() => setEditingSource(true)}
                className={`text-[11px] text-zinc-300 transition-opacity hover:text-zinc-400 ${hovered ? 'opacity-100' : 'opacity-0'}`}
              >
                + add source
              </button>
            )}
          </div>
        </div>

        {/* Right-side controls */}
        <div className={`flex shrink-0 items-center gap-2 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[11px]">
            {saveState === 'saving' && <span className="text-zinc-300">Saving…</span>}
            {saveState === 'saved' && (
              <span className="flex items-center gap-1 text-zinc-300">
                <Check size={10} /> Saved
              </span>
            )}
            {saveState === 'error' && <span className="text-red-300">Error</span>}
          </span>
          <button
            onClick={handleDelete}
            className="text-zinc-200 transition-colors hover:text-zinc-400"
            aria-label="Delete question"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Answer area */}
      {expanded && (
        <div className="border-t border-zinc-50 px-4 py-3 pl-10">
          <textarea
            ref={answerRef}
            value={answer}
            onChange={e => {
              setAnswer(e.target.value)
              autoResize(e.target)
            }}
            placeholder="Write your answer…"
            rows={4}
            className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-zinc-700 placeholder:text-zinc-300 focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
