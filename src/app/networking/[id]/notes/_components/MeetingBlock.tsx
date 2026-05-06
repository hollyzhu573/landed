'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import RichTextarea, { type RichTextareaHandle } from '@/src/components/ui/RichTextarea'
import { Handshake, Trash2, Check, CalendarDays } from 'lucide-react'
import { updateContactNote, updateContactNoteFreeform, updateContactNoteDate, deleteContactNote } from '@/src/app/networking/contact-note-actions'
import type { ContactNote, MeetingKind } from '@/src/lib/types'
import { MeetingBlockPicker } from './MeetingCanvas'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MeetingBlock({
  note,
  contactId,
  onDelete,
  onAddBlock,
  adding,
}: {
  note: ContactNote
  contactId: string
  onDelete: () => void
  onAddBlock: (kind: MeetingKind) => void
  adding: boolean
}) {
  const [content, setContent]               = useState(note.content)
  const [freeform, setFreeform]             = useState(note.freeform_note)
  const [meetingDate, setMeetingDate]       = useState(note.meeting_date ?? '')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [saveState, setSaveState]           = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hovered, setHovered]               = useState(false)
  const [freeformPickerOpen, setFreeformPickerOpen] = useState(false)
  const [freeformPickerRect, setFreeformPickerRect] = useState<DOMRect | null>(null)
  const slashCleanup = useRef<(() => void) | null>(null)
  const richRef = useRef<RichTextareaHandle>(null)

  const save = useCallback(async (value: string) => {
    setSaveState('saving')
    try {
      await updateContactNote(note.id, value)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }, [note.id])

  useEffect(() => {
    if (content === note.content) return
    const t = setTimeout(() => save(content), 800)
    return () => clearTimeout(t)
  }, [content, note.content, save])

  useEffect(() => {
    if (freeform === note.freeform_note) return
    const t = setTimeout(() => updateContactNoteFreeform(note.id, freeform), 800)
    return () => clearTimeout(t)
  }, [freeform, note.freeform_note, note.id])

  async function handleDateChange(value: string) {
    setMeetingDate(value)
    setShowDatePicker(false)
    await updateContactNoteDate(note.id, contactId, value || null)
  }

  async function handleDelete() {
    try {
      await deleteContactNote(note.id)
      onDelete()
    } catch {
      // block stays in UI on failure
    }
  }

  return (
    <div
      className="mb-2 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="rounded-xl border border-zinc-100 bg-white">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Handshake size={13} />
              <span className="text-xs font-medium uppercase tracking-wider">Touchpoint</span>
            </div>

            {showDatePicker ? (
              <input
                type="date"
                defaultValue={meetingDate}
                autoFocus
                onBlur={() => setShowDatePicker(false)}
                onChange={e => { if (e.target.value) handleDateChange(e.target.value) }}
                className="h-5 rounded border-0 bg-transparent text-[11px] text-zinc-400 focus:outline-none"
              />
            ) : meetingDate ? (
              <button
                onClick={() => setShowDatePicker(true)}
                className="flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-100"
              >
                <CalendarDays size={10} />
                <span>{formatDate(meetingDate)}</span>
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

        {/* Writing area */}
        <div className="border-t border-zinc-50 px-4 py-3">
          <RichTextarea
            ref={richRef}
            value={content}
            onChange={setContent}
            placeholder="What happened, what was said, anything to follow up on…"
            className="min-h-[80px] w-full text-[14px] leading-relaxed text-zinc-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Freeform continuation */}
      <div className="relative mt-2">
        {freeformPickerOpen && (
          <MeetingBlockPicker
            anchorRect={freeformPickerRect}
            onSelect={kind => {
              setFreeformPickerOpen(false)
              setFreeformPickerRect(null)
              slashCleanup.current?.()
              slashCleanup.current = null
              onAddBlock(kind)
            }}
            onClose={() => {
              setFreeformPickerOpen(false)
              setFreeformPickerRect(null)
              slashCleanup.current = null
            }}
          />
        )}
        <RichTextarea
          value={freeform}
          onChange={setFreeform}
          onSlash={(cleanup, rect) => { slashCleanup.current = cleanup; setFreeformPickerRect(rect); setFreeformPickerOpen(true) }}
          onSlashDismiss={() => { setFreeformPickerOpen(false); setFreeformPickerRect(null); slashCleanup.current = null }}
          disabled={adding}
          placeholder="Continue writing, or / for a new touchpoint…"
          className="min-h-[36px] w-full px-1 text-[14px] leading-relaxed text-zinc-700 focus:outline-none disabled:cursor-wait"
        />
      </div>
    </div>
  )
}
