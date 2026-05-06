'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { quickAddJob } from '@/src/app/jobs/actions'

type ParseResult = {
  company?: string | null
  role?: string | null
  location?: string | null
  salary_min?: number | null
  salary_max?: number | null
  error?: string
}

type SavedJob = { company: string; role: string }

export default function QuickApply({ headline, sub }: { headline: string; sub: string }) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'parsing' | 'saving' | 'error'>('idle')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<SavedJob | null>(null)
  const [displayed, setDisplayed] = useState('')
  const [typed, setTyped] = useState(false)
  const confettiFired = useRef(false)

  useEffect(() => {
    setDisplayed('')
    setTyped(false)
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(headline.slice(0, i))
      if (i >= headline.length) {
        clearInterval(interval)
        setTyped(true)
      }
    }, 75)
    return () => clearInterval(interval)
  }, [headline])

  useEffect(() => {
    if (!saved || confettiFired.current) return
    confettiFired.current = true

    import('canvas-confetti').then(({ default: confetti }) => {
      // First burst — center
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { x: 0.5, y: 0.45 },
        colors: ['#3A7A42', '#6655D8', '#1A78C8', '#E05830', '#C07000'],
        scalar: 0.9,
        gravity: 0.9,
      })
      // Delayed side bursts for extra pop
      setTimeout(() => {
        confetti({ particleCount: 40, angle: 60,  spread: 55, origin: { x: 0.15, y: 0.5 }, colors: ['#3A7A42', '#C07000'] })
        confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 0.85, y: 0.5 }, colors: ['#6655D8', '#1A78C8'] })
      }, 150)
    })
  }, [saved])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    setStatus('parsing')
    setError('')

    let parsed: ParseResult = {}
    try {
      const res = await fetch('/api/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      parsed = await res.json()
      if (!res.ok) parsed = {}
    } catch {
      parsed = {}
    }

    setStatus('saving')
    try {
      const result = await quickAddJob({
        company:    parsed.company    ?? 'Unknown',
        role:       parsed.role       ?? 'Unknown',
        location:   parsed.location   ?? null,
        job_url:    trimmed,
      })
      setSaved(result)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  function handleReset() {
    setUrl('')
    setSaved(null)
    setError('')
    confettiFired.current = false
  }

  const loading = status === 'parsing' || status === 'saving'

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {/* Animated check circle */}
        <div style={{ animation: 'pop-in 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="var(--color-sage-light)" stroke="var(--color-sage-border)" strokeWidth="1.5" />
            <polyline
              points="20,33 28,41 44,24"
              stroke="var(--color-sage)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray="36"
              strokeDashoffset="36"
              style={{ animation: 'draw-check 0.4s ease-out 0.3s forwards' }}
            />
          </svg>
        </div>

        {/* Confirmation copy */}
        <div style={{ animation: 'fade-up 0.5s ease-out 0.2s both' }}>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900">
            That's one more shot.
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            <span className="font-medium text-zinc-700">{saved.role}</span>
            {' '}at{' '}
            <span className="font-medium text-zinc-700">{saved.company}</span>
            {' '}— logged and ready to track.
          </p>
        </div>

        {/* Actions */}
        <div
          className="mt-8 flex items-center gap-4"
          style={{ animation: 'fade-up 0.5s ease-out 0.4s both' }}
        >
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            View all jobs <ArrowRight size={14} />
          </Link>
          <button
            onClick={handleReset}
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-600"
          >
            Log another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        {displayed}
        <span className="ml-0.5 inline-block w-0.5 h-7 bg-zinc-900 align-middle animate-[blink_0.8s_step-end_infinite]" />
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        {sub}
      </p>

      <div className="mt-8 w-full max-w-xl">
        <p className="mb-2 text-xs font-medium text-zinc-500 text-left">
          applied to a job today? drop the link here to record it
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://jobs.company.com/..."
            required
            disabled={loading}
            autoFocus
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-fern)] px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-sage)] disabled:opacity-40"
          >
            {status === 'parsing' ? 'Parsing…' : status === 'saving' ? 'Saving…' : (
              <>Log it <ArrowRight size={14} /></>
            )}
          </button>
        </form>

        {status === 'error' && (
          <p className="mt-3 text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}
