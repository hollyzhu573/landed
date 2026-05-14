'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Contact } from '@/src/lib/types'

const pad = (n: number) => String(n).padStart(2, '0')

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function FollowUpCalendar({ contacts }: { contacts: Contact[] }) {
  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const todayStr = localToday()

  // Map follow_up_due → contacts (exclude dormant)
  const byDate = new Map<string, Contact[]>()
  for (const c of contacts) {
    if (!c.follow_up_due || c.status === 'dormant') continue
    const arr = byDate.get(c.follow_up_due) ?? []
    arr.push(c)
    byDate.set(c.follow_up_due, arr)
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const firstDow    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function dateStr(day: number) {
    return `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Upcoming follow-ups sorted by date, limited to next visible ones
  const upcoming = [...byDate.entries()]
    .filter(([d]) => d >= todayStr)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 4)

  const overdue = [...byDate.entries()]
    .filter(([d]) => d < todayStr)
    .sort(([a], [b]) => b.localeCompare(a))

  return (
    <div>
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-zinc-700">{monthLabel}</span>
        <div className="flex gap-0.5">
          <button
            onClick={prevMonth}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={nextMonth}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-zinc-400">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-9" />
          const ds       = dateStr(day)
          const isToday  = ds === todayStr
          const hasFollowUp = byDate.has(ds)
          const isOverdue   = hasFollowUp && ds < todayStr
          const isDueToday  = hasFollowUp && ds === todayStr
          const isUpcoming  = hasFollowUp && ds > todayStr

          return (
            <div key={i} className="flex h-9 flex-col items-center justify-center gap-0.5">
              <div className={`
                flex h-6 w-6 items-center justify-center rounded-full text-[12px] leading-none
                ${isToday ? 'bg-zinc-900 font-semibold text-white scale-110' : 'text-zinc-600'}
                ${hasFollowUp && !isToday ? 'font-semibold text-zinc-900' : ''}
              `}>
                {day}
              </div>
              {hasFollowUp && (
                <div className={`h-1 w-1 rounded-full ${
                  isOverdue  ? 'bg-[var(--color-peach)] animate-pulse' :
                  isDueToday ? 'bg-[var(--color-honey)] animate-pulse' :
                               'bg-[var(--color-sage)]'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="mt-4 border-t border-zinc-100 pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-peach-text)]">Overdue</p>
          <ul className="space-y-1.5">
            {overdue.map(([date, cs]) =>
              cs.map(c => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/networking/${c.id}/notes`}
                    className="truncate text-[12px] font-medium text-zinc-700 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="shrink-0 font-mono text-[11px] text-[var(--color-peach-text)]">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mt-4 border-t border-zinc-100 pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Coming up</p>
          <ul className="space-y-1.5">
            {upcoming.map(([date, cs]) =>
              cs.map(c => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/networking/${c.id}/notes`}
                    className="truncate text-[12px] font-medium text-zinc-700 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="shrink-0 font-mono text-[11px] text-zinc-400">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {byDate.size === 0 && (
        <p className="mt-4 text-[12px] text-zinc-400">No follow-ups scheduled.</p>
      )}
    </div>
  )
}
