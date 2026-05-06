'use client'

import { useState, useCallback } from 'react'
import { Sparkles, RotateCcw } from 'lucide-react'
import type { ContactNote } from '@/src/lib/types'

type Summary = { remember: string[]; actions: string[]; error?: string }

export default function ContactSummary({
  contactId,
  name,
  notes,
}: {
  contactId: string
  name: string
  notes: ContactNote[]
}) {
  const cacheKey = `contact-summary:${contactId}`

  const [summary, setSummary] = useState<Summary | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const cached = localStorage.getItem(`contact-summary:${contactId}`)
      return cached ? (JSON.parse(cached) as Summary) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const strip = (html: string) => html.replace(/<[^>]+>/g, '').trim()
  const hasContent = notes.some(n => strip(n.content) || strip(n.freeform_note))

  const generate = useCallback(async () => {
    setLoading(true)
    setApiError(null)
    const payload = notes.map(n => n.content + ' ' + n.freeform_note)
    try {
      const res = await fetch('/api/contact-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, notes: payload }),
      })
      const data: Summary = await res.json()
      if (data.error) {
        setApiError(data.error)
      } else if (data.remember.length > 0 || data.actions.length > 0) {
        setSummary(data)
        try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* quota */ }
      } else {
        setApiError('Summary returned empty — add some meeting notes first')
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Could not reach the API')
    } finally {
      setLoading(false)
    }
  }, [name, notes, cacheKey])

  if (!hasContent) return null

  return (
    <div className="mb-8 rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-sage-light)] px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[var(--color-sage-text)]">
          <Sparkles size={12} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">At a glance</span>
        </div>
        {summary ? (
          <button
            onClick={generate}
            disabled={loading}
            className="text-zinc-300 transition-colors hover:text-zinc-500 disabled:opacity-40"
            aria-label="Regenerate summary"
          >
            <RotateCcw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        ) : (
          !loading && !apiError && (
            <button
              onClick={generate}
              className="flex items-center gap-1 rounded-full border border-[var(--color-sage-border)] bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-sage-text)] transition-colors hover:border-[var(--color-sage)] hover:bg-white hover:shadow-sm"
            >
              <Sparkles size={10} />
              Generate
            </button>
          )
        )}
      </div>

      {loading && !summary && !apiError && (
        <div className="space-y-2">
          {[40, 56, 48].map(w => (
            <div key={w} className="h-3 animate-pulse rounded bg-zinc-200" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {apiError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-red-500">API error</p>
          <p className="mt-0.5 font-mono text-[11px] text-red-400 break-all">{apiError}</p>
        </div>
      )}

      {summary && (
        <div className="space-y-3">
          {summary.remember.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-medium text-zinc-400">Remember</p>
              <ul className="space-y-1">
                {summary.remember.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-zinc-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.actions.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-medium text-zinc-400">Follow up</p>
              <ul className="space-y-1">
                {summary.actions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-zinc-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-sage)] opacity-70" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
