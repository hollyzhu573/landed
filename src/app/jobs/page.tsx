import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import type { Job, JobStatus } from '@/src/lib/types'
import StatusSelect from '@/src/app/jobs/_components/StatusSelect'
import JobRowActions from '@/src/app/jobs/_components/JobRowActions'
import InlineEditCell from '@/src/app/jobs/_components/InlineEditCell'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ── Pipeline ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: { status: JobStatus; label: string; dot: string }[] = [
  { status: 'wishlist',     label: 'Wishlist',     dot: 'bg-[var(--color-stone-border)]' },
  { status: 'applied',      label: 'Applied',      dot: 'bg-[var(--color-sky)]' },
  { status: 'interviewing', label: 'Interviewing', dot: 'bg-[var(--color-lavender)]' },
  { status: 'offer',        label: 'Offer',        dot: 'bg-[var(--color-sage)]' },
]

const STATUS_BADGE: Record<JobStatus, string> = {
  wishlist:     'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
  applied:      'bg-[var(--color-sky-light)] text-[var(--color-sky-text)]',
  interviewing: 'bg-[var(--color-lavender-light)] text-[var(--color-lavender-text)]',
  offer:        'bg-[var(--color-sage-light)] text-[var(--color-sage-text)]',
  rejected:     'bg-[var(--color-peach-light)] text-[var(--color-peach-text)]',
  withdrawn:    'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
}

function Pipeline({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) return null

  const closed = jobs.filter(j => j.status === 'rejected' || j.status === 'withdrawn').length

  return (
    <div className="mb-8 rounded-xl border border-[#DDDBD2] bg-white px-5 py-4">
      {/* Active stage counts */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {PIPELINE_STAGES.map(({ status, label, dot }) => {
          const count = jobs.filter(j => j.status === status).length
          return (
            <div key={status} className="flex items-baseline gap-2">
              <span className="font-mono text-[22px] font-semibold leading-none text-zinc-800">{count}</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                <span className="text-[12px] text-zinc-400">{label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Closed — muted, not prominent */}
      {closed > 0 && (
        <p className="mt-3 border-t border-zinc-100 pt-3 text-[11px] text-zinc-300">
          {closed} closed
        </p>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Job[]>()

  if (error) throw new Error(error.message)

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">Jobs</h1>
          <p className="mt-1 font-mono text-[12px] text-zinc-400">
            {jobs?.length ?? 0} application{jobs?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Add job
        </Link>
      </div>

      {!jobs?.length ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-20 text-center">
          <p className="text-sm text-zinc-400">No applications yet.</p>
          <Link href="/jobs/new" className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2">
            Add your first job
          </Link>
        </div>
      ) : (
        <>
          <Pipeline jobs={jobs} />

          <div className="overflow-hidden rounded-xl border border-[#DDDBD2] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/70 text-left text-[11px] font-semibold text-zinc-400">
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Applied</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="transition-colors hover:bg-zinc-50">
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
        </>
      )}
    </div>
  )
}
