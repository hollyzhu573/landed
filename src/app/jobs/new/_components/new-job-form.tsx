'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { createJob } from '@/src/app/jobs/actions'

const STATUSES = [
  { value: 'wishlist',     label: 'Wishlist' },
  { value: 'applied',     label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer',       label: 'Offer' },
  { value: 'rejected',    label: 'Rejected' },
  { value: 'withdrawn',   label: 'Withdrawn' },
]

export default function NewJobForm() {
  const [state, action, pending] = useActionState(createJob, undefined)

  const today = new Date().toISOString().split('T')[0]

  const [parseUrl, setParseUrl] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parseResult, setParseResult] = useState<Record<string, boolean> | null>(null)

  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [jobUrl, setJobUrl] = useState('')

  async function handleAutofill() {
    if (!parseUrl.trim()) return
    setParsing(true)
    setParseError('')
    setParseResult(null)
    try {
      const res = await fetch('/api/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parseUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setParseError(data.error ?? 'Something went wrong.')
        return
      }
      if (data.company)  setCompany(data.company)
      if (data.role)     setRole(data.role)
      if (data.location) setLocation(data.location)
      setJobUrl(parseUrl.trim())
      setParseResult({
        Company:  !!data.company,
        Role:     !!data.role,
        Location: !!data.location,
      })
    } catch {
      setParseError('Could not reach the server. Try again.')
    } finally {
      setParsing(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200'

  return (
    <form action={action} className="space-y-6">
      {/* Autofill from URL */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Autofill from job posting</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={parseUrl}
            onChange={(e) => setParseUrl(e.target.value)}
            placeholder="Paste the job posting URL…"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
          <button
            type="button"
            onClick={handleAutofill}
            disabled={parsing || !parseUrl.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 whitespace-nowrap"
          >
            {parsing ? 'Parsing…' : 'Autofill'}
          </button>
        </div>
        {parseError && (
          <p className="text-xs text-red-600">{parseError}</p>
        )}
        {parseResult && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(parseResult).map(([label, found]) => (
              <span
                key={label}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  found
                    ? 'bg-green-50 text-green-700'
                    : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                {found ? '✓' : '–'} {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Required fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="company" className="block text-sm font-medium text-zinc-700">
            Company <span className="text-red-400">*</span>
          </label>
          <input
            id="company"
            name="company"
            type="text"
            required
            placeholder="Google"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="role" className="block text-sm font-medium text-zinc-700">
            Role <span className="text-red-400">*</span>
          </label>
          <input
            id="role"
            name="role"
            type="text"
            required
            placeholder="Product Designer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="status" className="block text-sm font-medium text-zinc-700">
          Status <span className="text-red-400">*</span>
        </label>
        <select
          id="status"
          name="status"
          required
          defaultValue="wishlist"
          className={inputClass}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Optional fields */}
      <div className="border-t border-zinc-100 pt-6">
        <p className="mb-5 text-xs font-medium uppercase tracking-wider text-zinc-400">Optional</p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="date_applied" className="block text-sm font-medium text-zinc-700">
              Date applied
            </label>
            <input
              id="date_applied"
              name="date_applied"
              type="date"
              defaultValue={today}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="location" className="block text-sm font-medium text-zinc-700">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="San Francisco, CA · Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="job_url" className="block text-sm font-medium text-zinc-700">
              Job posting URL
            </label>
            <input
              id="job_url"
              name="job_url"
              type="url"
              placeholder="https://..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className={inputClass}
            />
          </div>

        </div>

        <div className="mt-5 space-y-1.5">
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Anything worth remembering about this application…"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-6">
        <Link
          href="/jobs"
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save job'}
        </button>
      </div>
    </form>
  )
}
