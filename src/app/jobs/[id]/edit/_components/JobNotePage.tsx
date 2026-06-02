'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Check } from 'lucide-react'
import { saveJobFields } from '@/src/app/jobs/actions'
import type { Job, JobStatus } from '@/src/lib/types'
import JobAnalysis from './JobAnalysis'

// ── Status config ────────────────────────────────────────────────────────────

const STATUSES: { value: JobStatus; label: string }[] = [
  { value: 'wishlist',     label: 'Wishlist' },
  { value: 'applied',      label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer',        label: 'Offer' },
  { value: 'rejected',     label: 'Rejected' },
  { value: 'withdrawn',    label: 'Withdrawn' },
]

const STATUS_STYLES: Record<JobStatus, string> = {
  wishlist:     'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
  applied:      'bg-[var(--color-sky-light)] text-[var(--color-sky-text)]',
  interviewing: 'bg-[var(--color-lavender-light)] text-[var(--color-lavender-text)]',
  offer:        'bg-[var(--color-sage-light)] text-[var(--color-sage-text)]',
  rejected:     'bg-[var(--color-peach-light)] text-[var(--color-peach-text)]',
  withdrawn:    'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
}

// ── Inline property row ──────────────────────────────────────────────────────

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-1.5">
      <span className="w-32 shrink-0 pt-px text-sm text-zinc-400">{label}</span>
      <div className="flex-1 text-sm text-zinc-700">{children}</div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function JobNotePage({ job }: { job: Job }) {
  const [company,       setCompany]       = useState(job.company)
  const [role,          setRole]          = useState(job.role)
  const [status,        setStatus]        = useState<JobStatus>(job.status)
  const [dateApplied,   setDateApplied]   = useState(job.date_applied ?? '')
  const [interviewDate, setInterviewDate] = useState(job.interview_date ?? '')
  const [location,      setLocation]      = useState(job.location ?? '')
  const [jobUrl,        setJobUrl]        = useState(job.job_url ?? '')
  const [notes,         setNotes]         = useState(job.notes ?? '')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const save = useCallback(async (updates: Parameters<typeof saveJobFields>[1]) => {
    setSaveState('saving')
    try {
      await saveJobFields(job.id, updates)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }, [job.id])

  function handleStatusChange(next: JobStatus) {
    setStatus(next)
    save({ status: next })
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10 pb-[100vh]">

      {/* Top bar */}
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/jobs"
          className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft size={14} />
          Jobs
        </Link>

        <span className="text-xs transition-opacity duration-300" style={{ opacity: saveState === 'idle' ? 0 : 1 }}>
          {saveState === 'saving' && <span className="text-zinc-400">Saving…</span>}
          {saveState === 'saved'  && <span className="flex items-center gap-1 text-zinc-400"><Check size={11} /> Saved</span>}
          {saveState === 'error'  && <span className="text-red-400">Couldn't save — check your connection</span>}
        </span>
      </div>

      {/* Status pill */}
      <div className="mb-5">
        <select
          value={status}
          onChange={e => handleStatusChange(e.target.value as JobStatus)}
          className={`cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-300 ${STATUS_STYLES[status]}`}
        >
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Title — company name */}
      <input
        value={company}
        onChange={e => setCompany(e.target.value)}
        onBlur={() => { if (company.trim() && company !== job.company) save({ company }) }}
        placeholder="Company"
        className="w-full bg-transparent text-4xl font-bold tracking-tight text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
      />

      {/* Subtitle — role */}
      <input
        value={role}
        onChange={e => setRole(e.target.value)}
        onBlur={() => { if (role.trim() && role !== job.role) save({ role }) }}
        placeholder="Role"
        className="mt-2 w-full bg-transparent text-xl text-zinc-400 placeholder:text-zinc-300 focus:outline-none"
      />

      {/* Properties */}
      <div className="mt-8 border-t border-zinc-100 pt-6">
        <Property label="Date applied">
          <input
            type="date"
            value={dateApplied}
            onChange={e => setDateApplied(e.target.value)}
            onBlur={() => save({ date_applied: dateApplied || null })}
            className="bg-transparent focus:outline-none"
          />
        </Property>

        <Property label="Interview date">
          <input
            type="date"
            value={interviewDate}
            onChange={e => setInterviewDate(e.target.value)}
            onBlur={() => save({ interview_date: interviewDate || null })}
            className="bg-transparent focus:outline-none"
          />
        </Property>

        <Property label="Location">
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onBlur={() => save({ location: location || null })}
            placeholder="e.g. San Francisco · Remote"
            className="w-full bg-transparent placeholder:text-zinc-300 focus:outline-none"
          />
        </Property>

        <Property label="Job URL">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={jobUrl}
              onChange={e => setJobUrl(e.target.value)}
              onBlur={() => save({ job_url: jobUrl || null })}
              placeholder="https://…"
              className="flex-1 bg-transparent placeholder:text-zinc-300 focus:outline-none"
            />
            {jobUrl && (
              <a
                href={jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-zinc-300 transition-colors hover:text-zinc-600"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </Property>
      </div>

      {/* AI job breakdown */}
      <div className="mt-8 border-t border-zinc-100 pt-8">
        <JobAnalysis jobUrl={jobUrl || null} jobId={job.id} />
      </div>

      {/* Freeform notes */}
      <div className="mt-8 border-t border-zinc-100 pt-8">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => save({ notes: notes || null })}
          placeholder="Notes…"
          rows={6}
          className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-zinc-700 placeholder:text-zinc-300 focus:outline-none"
        />
      </div>

    </div>
  )
}
