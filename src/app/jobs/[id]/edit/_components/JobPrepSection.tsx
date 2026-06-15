'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Sparkles, ChevronDown, ChevronRight, Trash2, Check, RotateCcw, BookMarked } from 'lucide-react'
import { createJobPrepQuestions, updateJobPrepAnswer, deleteJobPrepQuestion } from '@/src/app/jobs/prep-actions'
import type { Job, JobPrepQuestion, PrepCategory } from '@/src/lib/types'

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<PrepCategory, string> = {
  behavioral: 'Behavioral',
  portfolio:  'Portfolio',
  case_study: 'Case Study',
  technical:  'Technical',
  other:      'Other',
}

const CATEGORY_STYLES: Record<PrepCategory, string> = {
  behavioral: 'bg-zinc-100 text-zinc-500',
  portfolio:  'bg-violet-50 text-violet-600',
  case_study: 'bg-amber-50 text-amber-600',
  technical:  'bg-sky-50 text-sky-600',
  other:      'bg-zinc-100 text-zinc-400',
}

const INTERVIEW_TYPE_OPTIONS: { value: PrepCategory; label: string }[] = [
  { value: 'portfolio',  label: 'Portfolio review' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'case_study', label: 'Case study' },
  { value: 'technical',  label: 'Technical / design challenge' },
  { value: 'other',      label: 'General' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type BankQuestion = { question: string; category: PrepCategory | null }

type Suggestion = {
  question: string
  category: PrepCategory
  rationale: string
  fromBank: boolean
}

type JobAnalysisCache = {
  lookingFor: string[]
  skills: string[]
  prepTips: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function isValidCategory(s: string): s is PrepCategory {
  return ['behavioral', 'portfolio', 'case_study', 'technical', 'other'].includes(s)
}

// ── PrepCard ──────────────────────────────────────────────────────────────────

function PrepCard({ q, onDelete }: { q: JobPrepQuestion; onDelete: () => void }) {
  const [answer,    setAnswer]    = useState(q.answer)
  const [expanded,  setExpanded]  = useState(!q.answer)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hovered,   setHovered]   = useState(false)
  const answerRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (expanded && answerRef.current) autoResize(answerRef.current)
  }, [expanded])

  const saveAnswer = useCallback(async (value: string) => {
    setSaveState('saving')
    try {
      await updateJobPrepAnswer(q.id, value)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }, [q.id])

  useEffect(() => {
    if (answer === q.answer) return
    const t = setTimeout(() => saveAnswer(answer), 800)
    return () => clearTimeout(t)
  }, [answer, q.answer, saveAnswer])

  async function handleDelete() {
    try {
      await deleteJobPrepQuestion(q.id)
      onDelete()
    } catch { /* stay in UI */ }
  }

  return (
    <div
      className="group rounded-xl border border-zinc-100 bg-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-2 px-4 pt-3 pb-2">
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-[3px] shrink-0 text-zinc-300 transition-colors hover:text-zinc-500"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium leading-snug text-zinc-800">{q.question}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_STYLES[q.category]}`}>
              {CATEGORY_LABELS[q.category]}
            </span>
            {q.rationale && (
              <span className="text-[11px] text-zinc-300">{q.rationale}</span>
            )}
          </div>
        </div>

        <div className={`flex shrink-0 items-center gap-2 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[11px]">
            {saveState === 'saving' && <span className="text-zinc-300">Saving…</span>}
            {saveState === 'saved'  && <span className="flex items-center gap-1 text-zinc-300"><Check size={10} /> Saved</span>}
            {saveState === 'error'  && <span className="text-red-300">Error</span>}
          </span>
          <button onClick={handleDelete} className="text-zinc-200 transition-colors hover:text-zinc-400" aria-label="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-50 px-4 py-3 pl-10">
          <textarea
            ref={answerRef}
            value={answer}
            onChange={e => { setAnswer(e.target.value); autoResize(e.target) }}
            placeholder="Notes, key points, things to remember…"
            rows={3}
            className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-zinc-700 placeholder:text-zinc-300 focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}

// ── PrepSuggestions ───────────────────────────────────────────────────────────

function PrepSuggestions({
  job,
  interviewType,
  instructions,
  bankQuestions,
  existingQuestions,
  onAdd,
}: {
  job: Job
  interviewType: PrepCategory | null
  instructions: string
  bankQuestions: BankQuestion[]
  existingQuestions: string[]
  onAdd: (questions: JobPrepQuestion[]) => void
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected,    setSelected]    = useState<Set<number>>(new Set())
  const [loading,     setLoading]     = useState(false)
  const [adding,      setAdding]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [open,        setOpen]        = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    setOpen(true)

    let jobAnalysis: JobAnalysisCache | undefined
    try {
      const cached = localStorage.getItem(`job-analysis:${job.id}`)
      if (cached) jobAnalysis = JSON.parse(cached) as JobAnalysisCache
    } catch { /* ignore */ }

    try {
      const res = await fetch('/api/suggest-prep-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company:           job.company,
          role:              job.role,
          notes:             job.notes ?? undefined,
          jobAnalysis,
          interviewType:     interviewType ?? undefined,
          instructions:      instructions || undefined,
          bankQuestions,
          existingQuestions,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        const parsed: Suggestion[] = (data.suggestions as { question: string; category: string; rationale: string; fromBank: boolean }[])
          .map(s => ({
            question:  s.question,
            category:  isValidCategory(s.category) ? s.category : 'other',
            rationale: s.rationale,
            fromBank:  !!s.fromBank,
          }))
        setSuggestions(parsed)
        setSelected(new Set(parsed.map((_, i) => i)))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the API')
    } finally {
      setLoading(false)
    }
  }

  function toggle(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function handleAdd() {
    const chosen = suggestions.filter((_, i) => selected.has(i))
    if (!chosen.length) return
    setAdding(true)
    try {
      const created = await createJobPrepQuestions(
        job.id,
        chosen.map(s => ({ question: s.question, category: s.category, rationale: s.rationale })),
      )
      onAdd(created)
      setSuggestions([])
      setSelected(new Set())
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add questions')
    } finally {
      setAdding(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={generate}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[12px] font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
      >
        <Sparkles size={12} />
        Suggest questions
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-violet-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-500">
            Suggested questions
          </span>
        </div>
        {!loading && suggestions.length > 0 && (
          <button
            onClick={generate}
            className="text-zinc-300 transition-colors hover:text-zinc-500"
            aria-label="Regenerate"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-400">
            Pulling from your bank and generating questions…
          </p>
          {[60, 45, 70, 50, 65, 40, 55, 48].map((w, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-violet-100" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <p className="text-[11px] font-medium text-red-500">Couldn't generate suggestions</p>
          <p className="mt-0.5 font-mono text-[11px] text-red-400">{error}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <>
          <div className="space-y-1">
            {suggestions.map((s, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/60"
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  className="mt-[3px] shrink-0 accent-violet-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-zinc-700">{s.question}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_STYLES[s.category]}`}>
                      {CATEGORY_LABELS[s.category]}
                    </span>
                    {s.fromBank && (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <BookMarked size={9} />
                        from your bank
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400">{s.rationale}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={adding || selected.size === 0}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
            >
              {adding ? 'Adding…' : `Add ${selected.size} question${selected.size !== 1 ? 's' : ''} to prep`}
            </button>
            <button
              onClick={() => { setSuggestions([]); setOpen(false) }}
              className="text-[12px] text-zinc-400 hover:text-zinc-600"
            >
              Dismiss
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── JobPrepSection ────────────────────────────────────────────────────────────

export default function JobPrepSection({
  job,
  initialQuestions,
  bankQuestions,
}: {
  job: Job
  initialQuestions: JobPrepQuestion[]
  bankQuestions: BankQuestion[]
}) {
  const [questions,     setQuestions]     = useState(initialQuestions)
  const [interviewType, setInterviewType] = useState<PrepCategory | null>(null)
  const [instructions,  setInstructions]  = useState('')
  const instructionsRef = useRef<HTMLTextAreaElement>(null)

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const savedType = localStorage.getItem(`interview-type:${job.id}`)
      if (savedType) setInterviewType(savedType as PrepCategory)
      const savedInstructions = localStorage.getItem(`interview-instructions:${job.id}`)
      if (savedInstructions) setInstructions(savedInstructions)
    } catch { /* ignore */ }
  }, [job.id])

  // Persist interview type
  useEffect(() => {
    try {
      if (interviewType) {
        localStorage.setItem(`interview-type:${job.id}`, interviewType)
      } else {
        localStorage.removeItem(`interview-type:${job.id}`)
      }
    } catch { /* ignore */ }
  }, [interviewType, job.id])

  // Persist instructions
  useEffect(() => {
    try {
      localStorage.setItem(`interview-instructions:${job.id}`, instructions)
    } catch { /* ignore */ }
  }, [instructions, job.id])

  useEffect(() => {
    if (instructionsRef.current) autoResize(instructionsRef.current)
  }, [instructions])

  function handleAdd(newQs: JobPrepQuestion[]) {
    setQuestions(prev => [...prev, ...newQs])
  }

  function handleDelete(id: string) {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[13px] font-semibold text-zinc-700">Interview Prep</h2>
          {questions.length > 0 && (
            <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
              {questions.length} question{questions.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Interview context */}
      <div className="mb-4 space-y-2.5">
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-[11px] text-zinc-400">Interview type</span>
          <select
            value={interviewType ?? ''}
            onChange={e => setInterviewType((e.target.value as PrepCategory) || null)}
            className="bg-transparent text-[13px] text-zinc-700 focus:outline-none"
          >
            <option value="">Not sure yet</option>
            {INTERVIEW_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-28 shrink-0 pt-[3px] text-[11px] text-zinc-400">Instructions</span>
          <textarea
            ref={instructionsRef}
            value={instructions}
            onChange={e => { setInstructions(e.target.value); autoResize(e.target) }}
            placeholder="Paste any prep notes or instructions from the company…"
            rows={2}
            className="flex-1 resize-none bg-transparent text-[13px] leading-relaxed text-zinc-700 placeholder:text-zinc-300 focus:outline-none"
          />
        </div>

        <div className="flex justify-end">
          <PrepSuggestions
            job={job}
            interviewType={interviewType}
            instructions={instructions}
            bankQuestions={bankQuestions}
            existingQuestions={questions.map(q => q.question)}
            onAdd={handleAdd}
          />
        </div>
      </div>

      {questions.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4">
          {questions.map(q => (
            <PrepCard key={q.id} q={q} onDelete={() => handleDelete(q.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
