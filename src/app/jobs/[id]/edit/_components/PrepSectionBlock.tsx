'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import RichTextarea, { type RichTextareaHandle } from '@/src/components/ui/RichTextarea'
import {
  MessageCircle,
  Image,
  Laptop,
  Search,
  User,
  PenTool,
  Trash2,
  Check,
  CalendarDays,
} from 'lucide-react'
import { updatePrepSection, updatePrepSectionNote, updatePrepSectionDate, deletePrepSection } from '@/src/app/jobs/prep-actions'
import type { PrepSection, PrepCategory } from '@/src/lib/types'
import { BlockPicker } from './PrepCanvas'

// ── Block metadata ────────────────────────────────────────────────────────────

const BLOCK_META: Record<
  PrepCategory,
  { label: string; icon: React.ReactNode; placeholder: string; fallback: string[] }
> = {
  behavioral: {
    label: 'Behavioral',
    icon: <MessageCircle size={13} />,
    placeholder: "Walk through your STAR stories, what to emphasize, moments that show impact…",
    fallback: [
      "My strongest example here is when I...",
      "The situation was... and my role was to...",
      "The impact I drove on this was...",
      "What I'd do differently if I faced this again...",
      "The thing I most want to land in this story...",
    ],
  },
  portfolio: {
    label: 'Portfolio Review',
    icon: <Image size={13} />,
    placeholder: "Which projects to lead with, decisions to highlight, what to anticipate…",
    fallback: [
      "I'm leading with this project because...",
      "The decision I'm most proud of here was...",
      "If they ask what I'd change, I'll say...",
      "The metric that moved because of this work...",
      "A question I'm expecting and how I'll answer it...",
    ],
  },
  take_home: {
    label: 'Take-home',
    icon: <Laptop size={13} />,
    placeholder: "Your approach, assumptions, how you'll structure the presentation…",
    fallback: [
      "My approach: I'll start by...",
      "Before I begin, I need to clarify...",
      "The assumption I'm making is...",
      "How I'll structure the presentation...",
      "If I had more time, I'd also...",
    ],
  },
  product_critique: {
    label: 'Product Critique',
    icon: <Search size={13} />,
    placeholder: "Observations, what you'd improve, the user need behind each critique…",
    fallback: [
      "What this product does well...",
      "The core user need I'm designing around...",
      "The change I'd prioritize and why...",
      "What the business constraint might be here...",
      "How I'd sketch out my suggested fix...",
    ],
  },
  hiring_manager: {
    label: 'Hiring Manager',
    icon: <User size={13} />,
    placeholder: "Questions you want to ask, what to convey, what you want to understand…",
    fallback: [
      "I want to ask them about...",
      "What I want them to know about me...",
      "The thing I'm most curious to understand...",
      "I'll make sure to mention...",
      "Something I want to read the room on...",
    ],
  },
  whiteboard: {
    label: 'Whiteboard',
    icon: <PenTool size={13} />,
    placeholder: "How you'll structure your thinking, what to clarify first, your framework…",
    fallback: [
      "I'll kick off by asking about...",
      "The framework I'm planning to use...",
      "If I get stuck, I'll...",
      "I want to show my thinking by...",
      "How I'll split the time across phases...",
    ],
  },
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatInterviewDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getCountdown(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const interview = new Date(dateStr + 'T00:00:00')
  const days = Math.round((interview.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return ''
  if (days === 0) return 'today — you got this'
  if (days === 1) return 'tomorrow'
  if (days < 14) return `in ${days} days`
  return `in ${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? 's' : ''}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PrepBlock({
  section,
  company,
  role,
  jobUrl,
  onDelete,
  onAddBlock,
  adding,
}: {
  section: PrepSection
  company: string
  role: string
  jobUrl?: string
  onDelete: () => void
  onAddBlock: (category: PrepCategory) => void
  adding: boolean
}) {
  const meta = BLOCK_META[section.category]

  const [content, setContent]           = useState(section.answer)
  const [note, setNote]                 = useState(section.freeform_note)
  const [suggestions, setSuggestions]   = useState<string[] | null>(null)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [saveState, setSaveState]       = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hovered, setHovered]           = useState(false)
  const [interviewDate, setInterviewDate] = useState<string>(section.interview_date ?? '')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [notePickerOpen, setNotePickerOpen] = useState(false)
  const [notePickerRect, setNotePickerRect] = useState<DOMRect | null>(null)
  const slashCleanup = useRef<(() => void) | null>(null)

  const richRef = useRef<RichTextareaHandle>(null)

  // Fetch AI suggestions only for newly-created empty blocks
  useEffect(() => {
    if (section.answer.trim()) {
      // Block already has content — no need to fetch
      return
    }
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/prep-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company, role, category: section.category, jobUrl }),
        })
        if (cancelled) return
        if (!res.ok) {
          const errText = await res.text()
          console.error('[prep-suggestions] API error', res.status, errText)
          setSuggestError(`${res.status}: ${errText}`)
          setSuggestions(meta.fallback)
          return
        }
        const data = await res.json()
        console.log('[prep-suggestions] response:', data)
        const items = (data.suggestions as string[]) ?? []
        if (!cancelled) setSuggestions(items.length > 0 ? items : meta.fallback)
        if (items.length === 0 && !cancelled) setSuggestError(`empty — ${data.debug ?? 'no debug info'}`)
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error('[prep-suggestions] fetch error', msg)
          setSuggestError(msg)
          setSuggestions(meta.fallback)
        }
      }
    }
    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = useCallback(async (value: string) => {
    setSaveState('saving')
    try {
      await updatePrepSection(section.id, value)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }, [section.id])

  // Debounced autosave — main content
  useEffect(() => {
    if (content === section.answer) return
    const t = setTimeout(() => save(content), 800)
    return () => clearTimeout(t)
  }, [content, section.answer, save])

  // Debounced autosave — freeform note
  useEffect(() => {
    if (note === section.freeform_note) return
    const t = setTimeout(() => updatePrepSectionNote(section.id, note), 800)
    return () => clearTimeout(t)
  }, [note, section.freeform_note, section.id])

  function insertSuggestion(text: string) {
    richRef.current?.insert(text)
    setSuggestions(prev => (prev ? prev.filter(s => s !== text) : prev))
  }

  function handleNoteChange(html: string) {
    setNote(html)
  }

  async function handleDateChange(value: string) {
    setInterviewDate(value)
    setShowDatePicker(false)
    await updatePrepSectionDate(section.id, value || null)
  }

  async function handleDelete() {
    try {
      await deletePrepSection(section.id, section.job_id)
      onDelete()
    } catch {
      // silently fail — block stays in UI
    }
  }

  return (
    <div
      className="mb-2 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Interview block card */}
      <div className="rounded-xl border border-zinc-100 bg-white">

        {/* Header row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-zinc-400">
              {meta.icon}
              <span className="text-xs font-medium uppercase tracking-wider">{meta.label}</span>
            </div>

            {/* Interview date chip */}
            {showDatePicker ? (
              <input
                type="date"
                defaultValue={interviewDate}
                autoFocus
                onBlur={() => setShowDatePicker(false)}
                onChange={e => { if (e.target.value) handleDateChange(e.target.value) }}
                className="h-5 rounded border-0 bg-transparent text-[11px] text-zinc-400 focus:outline-none"
              />
            ) : interviewDate ? (
              <button
                onClick={() => setShowDatePicker(true)}
                className="flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-100"
              >
                <CalendarDays size={10} />
                <span>{formatInterviewDate(interviewDate)}</span>
                {getCountdown(interviewDate) && (
                  <span className="text-zinc-300">· {getCountdown(interviewDate)}</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowDatePicker(true)}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-zinc-300 opacity-0 transition-all hover:bg-zinc-50 hover:text-zinc-400 group-hover:opacity-100"
              >
                <CalendarDays size={10} />
                <span>add date</span>
              </button>
            )}
          </div>

          <div
            className="flex items-center gap-3 transition-opacity duration-150"
            style={{ opacity: hovered ? 1 : 0 }}
          >
            <span className="text-xs">
              {saveState === 'saving' && <span className="text-zinc-300">Saving…</span>}
              {saveState === 'saved' && (
                <span className="flex items-center gap-1 text-zinc-300">
                  <Check size={10} /> Saved
                </span>
              )}
              {saveState === 'error' && <span className="text-red-300">Couldn't save</span>}
            </span>
            <button
              onClick={handleDelete}
              className="text-zinc-200 transition-colors hover:text-zinc-400"
              aria-label="Delete block"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Suggestion error */}
        {suggestError && (
          <div className="border-t border-zinc-50 px-4 pt-2 pb-1">
            <p className="font-mono text-[11px] text-red-400">AI suggestions error: {suggestError}</p>
          </div>
        )}

        {/* Suggestion chips */}
        {suggestions !== null && suggestions.length > 0 && (
          <div className="border-t border-zinc-50 px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => insertSuggestion(s)}
                  className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 text-left text-[12px] text-zinc-500 transition-colors hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main writing area — inside the card */}
        <div className="border-t border-zinc-50 px-4 py-3">
          <RichTextarea
            ref={richRef}
            value={content}
            onChange={setContent}
            placeholder={meta.placeholder}
            className="min-h-[80px] w-full text-[14px] leading-relaxed text-zinc-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Freeform continuation — type freely or / to add another block */}
      <div className="relative mt-2">
        {notePickerOpen && (
          <BlockPicker
            anchorRect={notePickerRect}
            onSelect={category => {
              setNotePickerOpen(false)
              setNotePickerRect(null)
              slashCleanup.current?.()
              slashCleanup.current = null
              onAddBlock(category)
            }}
            onClose={() => {
              setNotePickerOpen(false)
              setNotePickerRect(null)
              slashCleanup.current = null
            }}
          />
        )}
        <RichTextarea
          value={note}
          onChange={handleNoteChange}
          onSlash={(cleanup, rect) => { slashCleanup.current = cleanup; setNotePickerRect(rect); setNotePickerOpen(true) }}
          onSlashDismiss={() => { setNotePickerOpen(false); setNotePickerRect(null); slashCleanup.current = null }}
          disabled={adding}
          placeholder="Continue writing, or / for a new block…"
          className="min-h-[36px] w-full px-1 text-[14px] leading-relaxed text-zinc-700 focus:outline-none disabled:cursor-wait"
        />
      </div>
    </div>
  )
}
