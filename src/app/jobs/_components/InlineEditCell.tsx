'use client'

import { useRef, useState, useTransition } from 'react'
import { updateJobField } from '@/src/app/jobs/actions'

interface Props {
  id: string
  field: 'company' | 'role' | 'date_applied'
  value: string | null
  display?: string
  type?: 'text' | 'date'
  className?: string
}

export default function InlineEditCell({ id, field, value, display, type = 'text', className }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(value ?? '')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function save() {
    setEditing(false)
    const trimmed = type === 'date' ? draft : draft.trim()
    if (trimmed === (value ?? '')) return
    startTransition(() => updateJobField(id, field, trimmed || null))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') {
      setDraft(value ?? '')
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className={`w-full rounded border border-zinc-300 bg-white px-2 py-0.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 ${className ?? ''}`}
      />
    )
  }

  const shown = display ?? value

  return (
    <span
      onClick={startEdit}
      title="Click to edit"
      className={`-mx-1 cursor-text rounded px-1 transition-colors hover:bg-zinc-100 ${pending ? 'opacity-40' : ''} ${className ?? ''}`}
    >
      {shown ?? <span className="text-zinc-300">—</span>}
    </span>
  )
}
