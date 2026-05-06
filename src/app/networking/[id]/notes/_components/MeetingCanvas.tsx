'use client'

import { useState, useRef } from 'react'
import { Handshake } from 'lucide-react'
import RichTextarea from '@/src/components/ui/RichTextarea'
import { createContactNote } from '@/src/app/networking/contact-note-actions'
import type { ContactNote, MeetingKind } from '@/src/lib/types'
import MeetingBlock from './MeetingBlock'

// ── Picker — single option, still requires confirmation ───────────────────────

export function MeetingBlockPicker({
  anchorRect,
  onSelect,
  onClose,
}: {
  anchorRect: DOMRect | null
  onSelect: (kind: MeetingKind) => void
  onClose: () => void
}) {
  const top  = anchorRect ? anchorRect.bottom + 6 : 0
  const left = anchorRect ? anchorRect.left       : 0

  return (
    <div
      style={{ position: 'fixed', top, left, zIndex: 50 }}
      className="w-44 rounded-xl border border-zinc-100 bg-white py-1 shadow-lg shadow-zinc-100"
    >
      <button
        onMouseDown={e => { e.preventDefault(); onSelect('touchpoint') }}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        <Handshake size={14} className="text-zinc-400" />
        Touchpoint
      </button>
    </div>
  )
}

// ── Canvas ─────────────────────────────────────────────────────────────────────

export default function MeetingCanvas({
  contactId,
  initialNotes,
}: {
  contactId: string
  initialNotes: ContactNote[]
}) {
  const [notes, setNotes] = useState<ContactNote[]>(initialNotes)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(false)

  async function addBlock(kind: MeetingKind, afterId?: string) {
    setAdding(true)
    setAddError(false)
    try {
      const afterIndex = afterId != null
        ? notes.findIndex(n => n.id === afterId)
        : notes.length - 1
      const insertAt = afterIndex + 1
      const note = await createContactNote(contactId, kind, insertAt)
      setNotes(prev => {
        const next = [...prev]
        next.splice(insertAt, 0, note)
        return next
      })
    } catch {
      setAddError(true)
      setTimeout(() => setAddError(false), 4000)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      {notes.map(note => (
        <MeetingBlock
          key={note.id}
          note={note}
          contactId={contactId}
          onDelete={() => setNotes(prev => prev.filter(n => n.id !== note.id))}
          onAddBlock={kind => addBlock(kind, note.id)}
          adding={adding}
        />
      ))}

      <CanvasEntry
        onAddBlock={kind => addBlock(kind, notes[notes.length - 1]?.id)}
        adding={adding}
      />

      {addError && (
        <p className="mt-2 text-xs text-red-400">
          Couldn't add block — make sure the database migration has been applied.
        </p>
      )}
    </div>
  )
}

// ── Bottom freeform entry ──────────────────────────────────────────────────────

function CanvasEntry({
  onAddBlock,
  adding,
}: {
  onAddBlock: (kind: MeetingKind) => void
  adding: boolean
}) {
  const [value, setValue]           = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerRect, setPickerRect] = useState<DOMRect | null>(null)
  const slashCleanup = useRef<(() => void) | null>(null)

  return (
    <div className="relative">
      {pickerOpen && (
        <MeetingBlockPicker
          anchorRect={pickerRect}
          onSelect={kind => {
            setPickerOpen(false)
            setPickerRect(null)
            slashCleanup.current?.()
            slashCleanup.current = null
            onAddBlock(kind)
          }}
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
        placeholder="Type / to log a touchpoint…"
        className="min-h-[120px] w-full px-1 text-[14px] leading-relaxed text-zinc-700 focus:outline-none disabled:cursor-wait"
      />
    </div>
  )
}
