import Link from 'next/link'
import NewJobForm from './_components/new-job-form'

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/jobs"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          ← Jobs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Add job</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <NewJobForm />
      </div>
    </div>
  )
}
