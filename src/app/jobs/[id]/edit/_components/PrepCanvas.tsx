'use client'

import { useState, useRef } from 'react'
import RichTextarea from '@/src/components/ui/RichTextarea'
import {
  MessageCircle,
  Image,
  Laptop,
  User,
  PenTool,
  Plus,
} from 'lucide-react'
import { createPrepSection } from '@/src/app/jobs/prep-actions'
import type { PrepSection, PrepCategory, Job, JobStatus } from '@/src/lib/types'
import PrepBlock from './PrepSectionBlock'

const BLOCK_TYPES: { category: PrepCategory; label: string; icon: React.ReactNode }[] = [
  { category: 'behavioral',     label: 'Behavioral',      icon: <MessageCircle size={14} /> },
  { category: 'portfolio',      label: 'Portfolio Review', icon: <Image size={14} /> },
  { category: 'take_home',      label: 'Take-home',        icon: <Laptop size={14} /> },
  { category: 'hiring_manager', label: 'Hiring Manager',   icon: <User size={14} /> },
  { category: 'whiteboard',     label: 'Whiteboard',       icon: <PenTool size={14} /> },
]

export default function PrepCanvas({
  job,
  initialSections,
  currentStatus,
}: {
  job: Job
  initialSections: PrepSection[]
  currentStatus: JobStatus
}) {
  const [sections, setSections] = useState<PrepSection[]>(initialSections)
  const [adding, setAdding]     = useState(false)
  const [addError, setAddError] = useState(false)

  // Insert a new block after the block with `afterId` (or at the end if omitted)
  async function addBlock(category: PrepCategory, afterId?: string) {
    setAdding(true)
    setAddError(false)
    try {
      const afterIndex = afterId != null
        ? sections.findIndex(s => s.id === afterId)
        : sections.length - 1
      const insertAt = afterIndex + 1
      const section = await createPrepSection(job.id, category, insertAt)
      setSections(prev => {
        const next = [...prev]
        next.splice(insertAt, 0, section)
        return next
      })
    } catch {
      setAddError(true)
      setTimeout(() => setAddError(false), 4000)
    } finally {
      setAdding(false)
    }
  }

  const showInterviewingPrompt = currentStatus === 'interviewing' && sections.length === 0

  return (
    <div>
      {/* Interviewing banner — quick-start when interviewing and no blocks yet */}
      {showInterviewingPrompt && (
        <div className="mb-6 rounded-xl border border-[var(--color-lavender-border)] bg-[var(--color-lavender-light)] px-5 py-4">
          <p className="mb-3 text-sm font-medium text-[var(--color-lavender-text)]">
            You&apos;re interviewing at {job.company} — time to prep.
          </p>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map(({ category, label }) => (
              <button
                key={category}
                onClick={() => addBlock(category)}
                className="flex items-center gap-1.5 rounded-full border border-[var(--color-lavender-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-lavender-text)] transition-colors hover:bg-[var(--color-lavender-border)]"
              >
                <Plus size={11} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Blocks — each freeform area inserts the next block right after itself */}
      {sections.map(section => (
        <PrepBlock
          key={section.id}
          section={section}
          company={job.company}
          role={job.role}
          jobUrl={job.job_url ?? undefined}
          onDelete={() => setSections(prev => prev.filter(s => s.id !== section.id))}
          onAddBlock={category => addBlock(category, section.id)}
          adding={adding}
        />
      ))}

      {/* Always-present freeform area — inserts after the last block */}
      <CanvasEntry
        onAddBlock={category => addBlock(category, sections[sections.length - 1]?.id)}
        adding={adding}
      />

      {addError && (
        <p className="mt-2 text-xs text-red-400">
          Couldn&apos;t add block — make sure the database migrations have been applied.
        </p>
      )}
    </div>
  )
}

// ── Bottom freeform entry ─────────────────────────────────────────────────────

function CanvasEntry({
  onAddBlock,
  adding,
}: {
  onAddBlock: (category: PrepCategory) => void
  adding: boolean
}) {
  const [value, setValue]             = useState('')
  const [pickerOpen, setPickerOpen]   = useState(false)
  const [pickerRect, setPickerRect]   = useState<DOMRect | null>(null)
  const slashCleanup = useRef<(() => void) | null>(null)

  function selectBlock(category: PrepCategory) {
    setPickerOpen(false)
    setPickerRect(null)
    slashCleanup.current?.()
    slashCleanup.current = null
    onAddBlock(category)
  }

  return (
    <div className="relative">
      {pickerOpen && (
        <BlockPicker
          anchorRect={pickerRect}
          onSelect={selectBlock}
          onClose={() => { setPickerOpen(false); setPickerRect(null); slashCleanup.current = null }}
        />
      )}
      <RichTextarea
        value={value}
        onChange={setValue}
        onSlash={(cleanup, rect) => {
          slashCleanup.current = cleanup
          setPickerRect(rect)
          setPickerOpen(true)
        }}
        onSlashDismiss={() => { setPickerOpen(false); setPickerRect(null); slashCleanup.current = null }}
        disabled={adding}
        placeholder="Type / to add an interview block…"
        className="min-h-[120px] w-full px-1 text-[14px] leading-relaxed text-zinc-700 focus:outline-none disabled:cursor-wait"
      />
    </div>
  )
}

// ── Shared block-type picker — fixed to cursor position ───────────────────────

export function BlockPicker({
  anchorRect,
  onSelect,
  onClose,
}: {
  anchorRect: DOMRect | null
  onSelect: (category: PrepCategory) => void
  onClose: () => void
}) {
  const top  = anchorRect ? anchorRect.bottom + 6 : 0
  const left = anchorRect ? anchorRect.left       : 0

  return (
    <div
      style={{ position: 'fixed', top, left, zIndex: 50 }}
      className="w-52 rounded-xl border border-zinc-100 bg-white py-1 shadow-lg shadow-zinc-100"
    >
      {BLOCK_TYPES.map(({ category, label, icon }) => (
        <button
          key={category}
          onMouseDown={e => { e.preventDefault(); onSelect(category) }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
        >
          <span className="text-zinc-400">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  )
}
