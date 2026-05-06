'use client'

import { useTransition } from 'react'
import { updateJobStatus } from '@/src/app/jobs/actions'
import type { JobStatus } from '@/src/lib/types'

const STATUSES: { value: JobStatus; label: string }[] = [
  { value: 'wishlist',     label: 'Wishlist' },
  { value: 'applied',     label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer',       label: 'Offer' },
  { value: 'rejected',    label: 'Rejected' },
  { value: 'withdrawn',   label: 'Withdrawn' },
]

const STATUS_STYLES: Record<JobStatus, string> = {
  wishlist:     'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
  applied:      'bg-[var(--color-sky-light)] text-[var(--color-sky-text)]',
  interviewing: 'bg-[var(--color-lavender-light)] text-[var(--color-lavender-text)]',
  offer:        'bg-[var(--color-sage-light)] text-[var(--color-sage-text)]',
  rejected:     'bg-[var(--color-peach-light)] text-[var(--color-peach-text)]',
  withdrawn:    'bg-[var(--color-stone)] text-[var(--color-text-secondary)]',
}

export default function StatusSelect({ id, status }: { id: string; status: JobStatus }) {
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as JobStatus
    startTransition(() => updateJobStatus(id, next))
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
