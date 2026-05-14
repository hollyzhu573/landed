'use client'

import { useState, useCallback } from 'react'
import { MessageCircle, Copy, Check, RotateCcw } from 'lucide-react'
import type { ContactNote } from '@/src/lib/types'

type SuggestionResult = { topic: string; message: string; error?: string }

export default function FollowUpSuggestion({
  name,
  role,
  company,
  howWeMet,
  lastContactDate,
  notes,
}: {
  name: string
  role?: string
  company?: string
  howWeMet?: string
  lastContactDate?: string
  notes: ContactNote[]
}) {
  const [result, setResult]     = useState<SuggestionResult | null>(null)
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)

  const daysSince = lastContactDate
    ? Math.floor((Date.now() - new Date(lastContactDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
    : null

  const generate = useCallback(async () => {
    setLoading(true)
    setApiError(null)
    const payload = notes.map(n => n.content + ' ' + n.freeform_note)
    try {
      const res = await fetch('/api/follow-up-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, company, howWeMet, notes: payload, daysSince }),
      })
      const data: SuggestionResult = await res.json()
      if (data.error) {
        setApiError(data.error)
      } else {
        setResult(data)
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Could not reach the API')
    } finally {
      setLoading(false)
    }
  }, [name, role, company, howWeMet, notes, daysSince])

  async function handleCopy() {
    if (!result?.message) return
    await navigator.clipboard.writeText(result.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const dayLabel = daysSince === null ? null : daysSince === 0 ? 'today' : `${daysSince}d ago`

  return (
    <div className="mb-6 rounded-xl border border-[var(--color-honey-border)] bg-[var(--color-honey-light)] px-5 py-4">

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[var(--color-honey-text)]">
          <MessageCircle size={12} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Follow-up due</span>
          {dayLabel && (
            <span className="ml-0.5 text-[11px] font-normal opacity-60">· last contact {dayLabel}</span>
          )}
        </div>
        {result ? (
          <button
            onClick={generate}
            disabled={loading}
            className="text-[var(--color-honey-text)] opacity-40 transition-opacity hover:opacity-70 disabled:opacity-20"
            aria-label="Regenerate suggestion"
          >
            <RotateCcw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        ) : (
          !loading && (
            <button
              onClick={generate}
              className="flex items-center gap-1 rounded-full border border-[var(--color-honey-border)] bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-honey-text)] transition-colors hover:border-[var(--color-honey)] hover:bg-white hover:shadow-sm"
            >
              Suggest a message
            </button>
          )
        )}
      </div>

      {/* Loading skeleton */}
      {loading && !result && (
        <div className="space-y-2">
          {[55, 70, 42].map(w => (
            <div
              key={w}
              className="h-3 animate-pulse rounded bg-amber-200/70"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {apiError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-red-500">API error</p>
          <p className="mt-0.5 break-all font-mono text-[11px] text-red-400">{apiError}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {result.topic && (
            <div>
              <p className="mb-1 text-[11px] font-medium text-[var(--color-honey-text)] opacity-60">What to bring up</p>
              <p className="text-[13px] leading-relaxed text-zinc-700">{result.topic}</p>
            </div>
          )}
          {result.message && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px] font-medium text-[var(--color-honey-text)] opacity-60">LinkedIn message</p>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-full border border-[var(--color-honey-border)] bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500 transition-all hover:bg-white hover:text-zinc-700 hover:shadow-sm"
                >
                  {copied
                    ? <><Check size={10} className="text-[var(--color-sage)]" /> Copied</>
                    : <><Copy size={10} /> Copy</>
                  }
                </button>
              </div>
              <p className="rounded-lg border border-[var(--color-honey-border)]/40 bg-white/60 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                {result.message.split(/(\[[^\]]+\])/g).map((part, i) =>
                  part.startsWith('[') && part.endsWith(']')
                    ? <span key={i} className="rounded bg-[var(--color-honey-light)] px-1 font-medium text-[var(--color-honey-text)]">{part}</span>
                    : part
                )}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
