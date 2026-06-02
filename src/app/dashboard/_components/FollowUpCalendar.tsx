'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Contact, Job } from '@/src/lib/types'

const pad = (n: number) => String(n).padStart(2, '0')

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

type CalendarEvent = {
  date: string
  label: string
  href: string
  type: 'followup' | 'interview'
}

function buildEvents(contacts: Contact[], jobs: Job[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()

  for (const c of contacts) {
    if (!c.follow_up_due || c.status === 'dormant') continue
    const arr = map.get(c.follow_up_due) ?? []
    arr.push({ date: c.follow_up_due, label: c.name, href: `/networking/${c.id}/notes`, type: 'followup' })
    map.set(c.follow_up_due, arr)
  }

  for (const j of jobs) {
    if (!j.interview_date) continue
    const arr = map.get(j.interview_date) ?? []
    arr.push({ date: j.interview_date, label: `${j.company}`, href: `/jobs/${j.id}/edit`, type: 'interview' })
    map.set(j.interview_date, arr)
  }

  return map
}

export default function FollowUpCalendar({ contacts, jobs }: { contacts: Contact[]; jobs: Job[] }) {
  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const todayStr = localToday()
  const byDate   = buildEvents(contacts, jobs)

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

  const upcoming = [...byDate.entries()]
    .filter(([d]) => d >= todayStr)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, evs]) => evs)
    .slice(0, 5)

  const overdue = [...byDate.entries()]
    .filter(([d]) => d < todayStr)
    .sort(([a], [b]) => b.localeCompare(a))
    .flatMap(([, evs]) => evs)

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div>
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-zinc-700">{monthLabel}</span>
        <div className="flex gap-0.5">
          <button onClick={prevMonth} className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700">
            <ChevronLeft size={13} />
          </button>
          <button onClick={nextMonth} className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700">
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
          const ds      = dateStr(day)
          const isToday = ds === todayStr
          const events  = byDate.get(ds) ?? []
          const hasFollowup  = events.some(e => e.type === 'followup')
          const hasInterview = events.some(e => e.type === 'interview')
          const isOverdue    = events.length > 0 && ds < todayStr
          const isDueToday   = events.length > 0 && ds === todayStr

          return (
            <div key={i} className="flex h-9 flex-col items-center justify-center gap-0.5">
              <div className={`
                flex h-6 w-6 items-center justify-center rounded-full text-[12px] leading-none
                ${isToday ? 'bg-zinc-900 font-semibold text-white scale-110' : 'text-zinc-600'}
                ${events.length > 0 && !isToday ? 'font-semibold text-zinc-900' : ''}
              `}>
                {day}
              </div>
              {events.length > 0 && (
                <div className="flex gap-0.5">
                  {hasFollowup && (
                    <div className={`h-1 w-1 rounded-full ${
                      isOverdue  ? 'bg-[var(--color-peach)] animate-pulse' :
                      isDueToday ? 'bg-[var(--color-honey)] animate-pulse' :
                                   'bg-[var(--color-sage)]'
                    }`} />
                  )}
                  {hasInterview && (
                    <div className="h-1 w-1 rounded-full bg-[var(--color-lavender)]" />
                  )}
                </div>
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
            {overdue.map((ev, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <Link href={ev.href} className="truncate text-[12px] font-medium text-zinc-700 hover:underline">
                  {ev.label}
                </Link>
                <span className="shrink-0 font-mono text-[11px] text-[var(--color-peach-text)]">
                  {formatDate(ev.date)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mt-4 border-t border-zinc-100 pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Coming up</p>
          <ul className="space-y-1.5">
            {upcoming.map((ev, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${ev.type === 'interview' ? 'bg-[var(--color-lavender)]' : 'bg-[var(--color-sage)]'}`} />
                  <Link href={ev.href} className="truncate text-[12px] font-medium text-zinc-700 hover:underline">
                    {ev.label}
                  </Link>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-zinc-400">
                  {formatDate(ev.date)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {byDate.size === 0 && (
        <p className="mt-4 text-[12px] text-zinc-400">No upcoming dates.</p>
      )}
    </div>
  )
}
