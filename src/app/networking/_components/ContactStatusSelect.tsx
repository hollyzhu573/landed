'use client'

import { useTransition } from 'react'
import { updateContactStatus } from '@/src/app/networking/actions'
import type { ContactStatus } from '@/src/lib/types'

const STATUSES: { value: ContactStatus; label: string }[] = [
  { value: 'to_reach_out', label: 'To reach out' },
  { value: 'reached_out',  label: 'Reached out' },
  { value: 'following_up', label: 'Following up' },
  { value: 'connected',    label: 'Connected' },
  { value: 'dormant',      label: 'Dormant' },
]

const STATUS_STYLES: Record<ContactStatus, string> = {
  to_reach_out: 'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
  reached_out:  'bg-[var(--color-sky-light)] text-[var(--color-sky-text)]',
  following_up: 'bg-[var(--color-honey-light)] text-[var(--color-honey-text)]',
  connected:    'bg-[var(--color-sage-light)] text-[var(--color-sage-text)]',
  dormant:      'bg-[var(--color-stone)] text-[var(--color-text-tertiary)]',
}

export default function ContactStatusSelect({ id, status }: { id: string; status: ContactStatus }) {
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ContactStatus
    startTransition(() => updateContactStatus(id, next))
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={pending}
      className={`cursor-pointer rounded-full border-0 px-2.5 py-0.5 text-xs font-medium ring-0 outline-none appearance-none transition-opacity disabled:opacity-50 ${STATUS_STYLES[status]}`}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  )
}
