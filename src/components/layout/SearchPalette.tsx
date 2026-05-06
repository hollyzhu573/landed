'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Briefcase, Users, ArrowRight } from 'lucide-react'
import { useSearch } from '@/src/lib/search-context'
import type { JobStatus, ContactStatus } from '@/src/lib/types'

type JobResult    = { id: string; company: string; role: string; status: JobStatus }
type ContactResult = { id: string; name: string; company: string | null; role: string | null; status: ContactStatus }
type Results = { jobs: JobResult[]; contacts: ContactResult[] }

const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  wishlist:     'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
  applied:      'bg-[var(--color-sky-light)] text-[var(--color-sky-text)]',
  interviewing: 'bg-[var(--color-lavender-light)] text-[var(--color-lavender-text)]',
  offer:        'bg-[var(--color-sage-light)] text-[var(--color-sage-text)]',
  rejected:     'bg-[var(--color-peach-light)] text-[var(--color-peach-text)]',
  withdrawn:    'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
}

const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  wishlist: 'Wishlist', applied: 'Applied', interviewing: 'Interviewing',
  offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn',
}

const CONTACT_STATUS_STYLES: Record<ContactStatus, string> = {
  to_reach_out: 'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
  reached_out:  'bg-[var(--color-sky-light)] text-[var(--color-sky-text)]',
  following_up: 'bg-[var(--color-honey-light)] text-[var(--color-honey-text)]',
  connected:    'bg-[var(--color-sage-light)] text-[var(--color-sage-text)]',
  dormant:      'bg-[var(--color-stone)] text-zinc-400',
}

const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  to_reach_out: 'To reach out', reached_out: 'Reached out',
  following_up: 'Following up', connected: 'Connected', dormant: 'Dormant',
}

export default function SearchPalette() {
  const { open, setOpen } = useSearch()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results>({ jobs: [], contacts: [] })
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setOpen])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10)
      setQuery('')
      setResults({ jobs: [], contacts: [] })
      setActiveIndex(0)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults({ jobs: [], contacts: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data: Results = await res.json()
        setResults(data)
        setActiveIndex(0)
      } finally {
        setLoading(false)
      }
    }, 180)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Flat list for keyboard navigation
  const flatItems = [
    ...results.jobs.map((j) => ({ type: 'job' as const, item: j })),
    ...results.contacts.map((c) => ({ type: 'contact' as const, item: c })),
  ]

  const navigate = useCallback((index: number) => {
    const entry = flatItems[index]
    if (!entry) return
    if (entry.type === 'job') {
      router.push(`/jobs/${entry.item.id}/edit`)
    } else {
      router.push(`/networking`)
    }
    setOpen(false)
  }, [flatItems, router, setOpen])

  // Keyboard navigation within palette
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        navigate(activeIndex)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, flatItems.length, activeIndex, navigate, setOpen])

  if (!open) return null

  const hasResults = results.jobs.length > 0 || results.contacts.length > 0
  let globalIndex = -1

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ animation: 'pop-in 0.18s cubic-bezier(0.25,1,0.5,1) forwards' }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5">
          <Search size={16} className="shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs and contacts…"
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          />
          {loading && (
            <span className="text-xs text-zinc-400">Searching…</span>
          )}
          <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">ESC</kbd>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-[400px] overflow-y-auto py-2">
            {!hasResults && !loading && (
              <p className="px-5 py-8 text-center text-sm text-zinc-400">
                No results for <span className="font-medium text-zinc-600">&ldquo;{query}&rdquo;</span>
              </p>
            )}

            {results.jobs.length > 0 && (
              <section>
                <div className="flex items-center gap-2 px-4 pb-1 pt-2">
                  <Briefcase size={11} className="text-zinc-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Jobs</span>
                </div>
                {results.jobs.map((job) => {
                  globalIndex++
                  const idx = globalIndex
                  const isActive = activeIndex === idx
                  return (
                    <button
                      key={job.id}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => navigate(idx)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-zinc-50' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">{job.company}</p>
                        <p className="truncate text-xs text-zinc-500">{job.role}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${JOB_STATUS_STYLES[job.status]}`}>
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                      {isActive && <ArrowRight size={13} className="shrink-0 text-zinc-400" />}
                    </button>
                  )
                })}
              </section>
            )}

            {results.contacts.length > 0 && (
              <section className={results.jobs.length > 0 ? 'mt-1 border-t border-zinc-100 pt-1' : ''}>
                <div className="flex items-center gap-2 px-4 pb-1 pt-2">
                  <Users size={11} className="text-zinc-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Contacts</span>
                </div>
                {results.contacts.map((contact) => {
                  globalIndex++
                  const idx = globalIndex
                  const isActive = activeIndex === idx
                  return (
                    <button
                      key={contact.id}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => navigate(idx)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-zinc-50' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">{contact.name}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {[contact.role, contact.company].filter(Boolean).join(' @ ')}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTACT_STATUS_STYLES[contact.status]}`}>
                        {CONTACT_STATUS_LABELS[contact.status]}
                      </span>
                      {isActive && <ArrowRight size={13} className="shrink-0 text-zinc-400" />}
                    </button>
                  )
                })}
              </section>
            )}
          </div>
        )}

        {/* Footer hint */}
        {!query.trim() && (
          <div className="flex items-center gap-4 px-4 py-3 text-xs text-zinc-400">
            <span><kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium">↑↓</kbd> navigate</span>
            <span><kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium">↵</kbd> open</span>
            <span><kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium">esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  )
}
