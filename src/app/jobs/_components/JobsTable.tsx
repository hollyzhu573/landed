'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { Job, JobStatus } from '@/src/lib/types'
import StatusSelect from './StatusSelect'
import JobRowActions from './JobRowActions'
import InlineEditCell from './InlineEditCell'

type SortKey = 'company' | 'role' | 'status' | 'date_applied'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<JobStatus, number> = {
  wishlist: 0, applied: 1, interviewing: 2, offer: 3, rejected: 4, withdrawn: 5,
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function compareJobs(a: Job, b: Job, key: SortKey, dir: SortDir): number {
  let cmp = 0
  if (key === 'status') {
    cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  } else if (key === 'date_applied') {
    const da = a.date_applied ?? ''
    const db = b.date_applied ?? ''
    cmp = da < db ? -1 : da > db ? 1 : 0
  } else {
    const va = (a[key] ?? '').toLowerCase()
    const vb = (b[key] ?? '').toLowerCase()
    cmp = va < vb ? -1 : va > vb ? 1 : 0
  }
  return dir === 'asc' ? cmp : -cmp
}

function sortJobs(jobs: Job[], key: SortKey, dir: SortDir): Job[] {
  const interviewing = jobs.filter(j => j.status === 'interviewing')
  const rest         = jobs.filter(j => j.status !== 'interviewing')
  return [
    ...interviewing.sort((a, b) => compareJobs(a, b, key, dir)),
    ...rest.sort((a, b) => compareJobs(a, b, key, dir)),
  ]
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp size={11} className="opacity-0 group-hover/th:opacity-30" />
  return sortDir === 'asc'
    ? <ChevronUp size={11} className="opacity-70" />
    : <ChevronDown size={11} className="opacity-70" />
}

export default function JobsTable({ jobs: initialJobs }: { jobs: Job[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('date_applied')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const jobs = sortJobs(initialJobs, sortKey, sortDir)

  const th = (key: SortKey, label: string) => (
    <th
      className="group/th cursor-pointer select-none px-6 py-3"
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
      </div>
    </th>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-[#DDDBD2] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/70 text-left text-[11px] font-semibold text-zinc-400">
            {th('company', 'Company')}
            {th('role', 'Role')}
            {th('status', 'Status')}
            {th('date_applied', 'Applied')}
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {jobs.map((job) => (
            <tr
              key={job.id}
              className={`transition-colors hover:bg-zinc-50 ${job.status === 'interviewing' ? 'bg-[var(--color-lavender-light,#f5f3ff)]' : ''}`}
            >
              <td className="px-6 py-4 font-medium text-zinc-900">
                <InlineEditCell id={job.id} field="company" value={job.company} />
              </td>
              <td className="px-6 py-4 text-zinc-600">
                <InlineEditCell id={job.id} field="role" value={job.role} />
              </td>
              <td className="px-6 py-4">
                <StatusSelect id={job.id} status={job.status} />
              </td>
              <td className="px-6 py-4 font-mono text-[12px] text-zinc-400">
                <InlineEditCell
                  id={job.id}
                  field="date_applied"
                  value={job.date_applied}
                  display={formatDate(job.date_applied)}
                  type="date"
                />
              </td>
              <td className="px-4 py-4">
                <JobRowActions id={job.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
