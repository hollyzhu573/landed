'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown, ChevronRight, Trash2, Check, Mic, Square } from 'lucide-react'
import { updateQuestion, updateAnswer, updateSource, updateCategory, deleteQuestion } from '../actions'
import type { PrepCategory, QuestionBankEntry } from '@/src/lib/types'

const CATEGORY_OPTIONS: { value: PrepCategory; label: string }[] = [
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

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

// ── Web Speech API types (not in standard TS lib) ────────────────────────────

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult:  ((e: SpeechRecognitionResultEvent) => void) | null
  onerror:   ((e: { error: string }) => void) | null
  onend:     (() => void) | null
}
type SpeechRecognitionResultEvent = {
  results: { [i: number]: { [i: number]: { transcript: string }; isFinal: boolean }; length: number }
  resultIndex: number
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuestionCard({
  entry,
  autoFocus,
  onDelete,
  onCategoryChange,
}: {
  entry: QuestionBankEntry
  autoFocus?: boolean
  onDelete: () => void
  onCategoryChange?: (category: PrepCategory | null) => void
}) {
  const [question, setQuestion] = useState(entry.question)
  const [answer,   setAnswer]   = useState(entry.answer)
  const [category, setCategory] = useState<PrepCategory | null>(entry.category ?? null)
  const [source,   setSource]   = useState(entry.source ?? '')
  const [expanded, setExpanded] = useState(!entry.answer)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hovered,  setHovered]  = useState(false)
  const [editingSource, setEditingSource] = useState(false)

  // Voice
  const [recording,    setRecording]    = useState(false)
  const [transcript,   setTranscript]   = useState('')   // finalized
  const [interimText,  setInterimText]  = useState('')   // live partial
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const questionRef = useRef<HTMLTextAreaElement>(null)
  const answerRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null)
  }, [])

  useEffect(() => {
    if (autoFocus && questionRef.current) {
      questionRef.current.focus()
      setExpanded(true)
    }
  }, [autoFocus])

  useEffect(() => {
    if (questionRef.current) autoResize(questionRef.current)
  }, [])

  useEffect(() => {
    if (expanded && answerRef.current) autoResize(answerRef.current)
  }, [expanded])

  // Stop recording when card collapses
  useEffect(() => {
    if (!expanded && recording) stopRecording()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    if (answer === entry.answer) return
    const t = setTimeout(() => saveAnswer(answer), 800)
    return () => clearTimeout(t)
  }, [answer, entry.answer, saveAnswer])

  useEffect(() => {
    if (question === entry.question) return
    const t = setTimeout(() => updateQuestion(entry.id, question), 800)
    return () => clearTimeout(t)
  }, [question, entry.question, entry.id])

  useEffect(() => {
    const existing = entry.source ?? ''
    if (source === existing) return
    const t = setTimeout(() => updateSource(entry.id, source || null), 800)
    return () => clearTimeout(t)
  }, [source, entry.source, entry.id])

  async function handleCategoryChange(next: PrepCategory | null) {
    setCategory(next)
    onCategoryChange?.(next)
    await updateCategory(entry.id, next)
  }

  async function handleDelete() {
    try {
      await deleteQuestion(entry.id)
      onDelete()
    } catch { /* stay in UI */ }
  }

  // ── Voice handlers ───────────────────────────────────────────────────────

  function startRecording() {
    const SR = getSpeechRecognition()
    if (!SR) return

    const rec = new SR()
    rec.continuous     = true
    rec.interimResults = true
    rec.lang           = 'en-US'

    let finalAccumulated = transcript // build on top of existing transcript

    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          finalAccumulated += (finalAccumulated ? ' ' : '') + text.trim()
          setTranscript(finalAccumulated)
        } else {
          interim += text
        }
      }
      setInterimText(interim)
    }

    rec.onerror = () => stopRecording()
    rec.onend   = () => { setRecording(false); setInterimText('') }

    recognitionRef.current = rec
    rec.start()
    setRecording(true)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setRecording(false)
    setInterimText('')
  }

  function insertTranscript() {
    const joined = answer
      ? answer.trimEnd() + '\n\n' + transcript
      : transcript
    setAnswer(joined)
    setTranscript('')
    setTimeout(() => { if (answerRef.current) autoResize(answerRef.current) }, 0)
  }

  // ── Render ───────────────────────────────────────────────────────────────

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
            onChange={e => { setQuestion(e.target.value); autoResize(e.target) }}
            rows={1}
            placeholder="What's the question?"
            className="w-full resize-none overflow-hidden bg-transparent text-[14px] font-medium leading-snug text-zinc-800 placeholder:text-zinc-300 focus:outline-none"
          />

          {/* Category + Source inline */}
          <div className={`mt-1 flex items-center gap-2 transition-opacity ${hovered ? 'opacity-100' : 'opacity-50'}`}>
            {category && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${CATEGORY_DOT[category]}`} />}
            <select
              value={category ?? ''}
              onChange={e => handleCategoryChange((e.target.value as PrepCategory) || null)}
              className="bg-transparent text-[11px] text-zinc-400 focus:outline-none"
            >
              <option value="">Not selected</option>
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {(source || hovered) && <span className="text-zinc-200">·</span>}

            {editingSource ? (
              <input
                autoFocus
                value={source}
                onChange={e => setSource(e.target.value)}
                onBlur={() => setEditingSource(false)}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                placeholder="Source (e.g. Figma loop, Blind)"
                className="bg-transparent text-[11px] text-zinc-400 placeholder:text-zinc-300 focus:outline-none"
              />
            ) : source ? (
              <button onClick={() => setEditingSource(true)} className="text-[11px] text-zinc-400 hover:text-zinc-600">
                {source}
              </button>
            ) : (
              <button
                onClick={() => setEditingSource(true)}
                className="text-[11px] text-zinc-300 hover:text-zinc-400"
              >
                + source
              </button>
            )}
          </div>
        </div>

        {/* Right-side controls */}
        <div className={`flex shrink-0 items-center gap-2 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[11px]">
            {saveState === 'saving' && <span className="text-zinc-300">Saving…</span>}
            {saveState === 'saved'  && <span className="flex items-center gap-1 text-zinc-300"><Check size={10} /> Saved</span>}
            {saveState === 'error'  && <span className="text-red-300">Error</span>}
          </span>
          <button onClick={handleDelete} className="text-zinc-200 transition-colors hover:text-zinc-400" aria-label="Delete question">
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
            onChange={e => { setAnswer(e.target.value); autoResize(e.target) }}
            placeholder="Notes, key points, things to remember…"
            rows={4}
            className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-zinc-700 placeholder:text-zinc-300 focus:outline-none"
          />

          {/* Voice controls */}
          {speechSupported && (
            <div className="mt-2 flex items-start justify-between gap-3">
              {/* Mic button */}
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  recording
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'text-zinc-300 hover:bg-zinc-50 hover:text-zinc-500'
                }`}
                aria-label={recording ? 'Stop recording' : 'Start voice input'}
              >
                {recording
                  ? <><Square size={10} className="fill-current" /> Stop</>
                  : <><Mic size={11} /> Speak</>
                }
              </button>

              {/* Live indicator */}
              {recording && (
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                  <span className="text-[11px] text-zinc-400">Listening…</span>
                </div>
              )}
            </div>
          )}

          {/* Live interim transcript */}
          {interimText && (
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-300 italic">
              {interimText}
            </p>
          )}

          {/* Finalized transcript */}
          {transcript && !recording && (
            <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-2.5">
              <p className="text-[11px] leading-relaxed text-zinc-400">{transcript}</p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={insertTranscript}
                  className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800"
                >
                  Insert into answer
                </button>
                <button
                  onClick={() => setTranscript('')}
                  className="text-[11px] text-zinc-300 hover:text-zinc-500"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
