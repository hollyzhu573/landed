'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, RotateCcw } from 'lucide-react'

type Analysis = {
  lookingFor: string[]
  skills: string[]
  prepTips: string[]
  error?: string
}

export default function JobAnalysis({ jobUrl, jobId }: { jobUrl: string | null; jobId: string }) {
  const cacheKey = `job-analysis:${jobId}`

  const [analysis, setAnalysis] = useState<Analysis | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const cached = localStorage.getItem(`job-analysis:${jobId}`)
      return cached ? (JSON.parse(cached) as Analysis) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    if (!jobUrl) return
    setLoading(true)
    setApiError(null)
    try {
      const res  = await fetch('/api/job-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl }),
      })
      const data: Analysis = await res.json()
      if (data.error) {
        setApiError(data.error)
      } else if (data.lookingFor.length > 0 || data.skills.length > 0 || data.prepTips.length > 0) {
        setAnalysis(data)
        try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* quota */ }
      } else {
        setApiError('Analysis returned empty — the job page may require login')
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Could not reach the API')
    } finally {
      setLoading(false)
    }
  }, [jobUrl, cacheKey])

  if (!jobUrl) return null

  return (
    <div className="mb-8 rounded-xl border border-[var(--color-sky-border)] bg-[var(--color-sky-light)] px-5 py-4">

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[var(--color-sky-text)]">
          <Sparkles size={12} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Job breakdown</span>
        </div>
        {analysis ? (
          <button
            onClick={generate}
            disabled={loading}
            className="text-zinc-300 transition-colors hover:text-zinc-500 disabled:opacity-40"
            aria-label="Regenerate analysis"
          >
            <RotateCcw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        ) : (
          !loading && !apiError && (
            <button
              onClick={generate}
              className="flex items-center gap-1 rounded-full border border-[var(--color-sky-border)] bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-sky-text)] transition-colors hover:border-[var(--color-sky)] hover:bg-white hover:shadow-sm"
            >
              <Sparkles size={10} />
              Generate
            </button>
          )
        )}
      </div>

      {/* Loading skeleton */}
      {loading && !analysis && !apiError && (
        <div className="space-y-1.5">
          <p className="mb-2 text-[11px] text-zinc-400">Analyzing job description…</p>
          {[55, 40, 68, 35, 50, 45].map(w => (
            <div
              key={w}
              className="h-3 animate-pulse rounded bg-sky-100"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {apiError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-red-500">Couldn't analyze</p>
          <p className="mt-0.5 break-all font-mono text-[11px] text-red-400">{apiError}</p>
        </div>
      )}

      {/* Results — dim slightly while regenerating */}
      {analysis && (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>

          {analysis.lookingFor.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-zinc-400">What they're looking for</p>
              <ul className="space-y-1">
                {analysis.lookingFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-zinc-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.skills.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-zinc-400">Key skills</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-[var(--color-sky-border)] bg-white/70 px-2.5 py-0.5 text-[12px] text-zinc-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.prepTips.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-zinc-400">Prep focus</p>
              <ul className="space-y-1">
                {analysis.prepTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-zinc-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-sky)] opacity-70" />
                    {tip}
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
