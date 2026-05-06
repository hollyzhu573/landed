'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { FileText, Trash2 } from 'lucide-react'
import { deleteJob } from '@/src/app/jobs/actions'

export default function JobRowActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Delete this job? This can't be undone.")) return
    startTransition(() => deleteJob(id))
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/jobs/${id}/edit`}
        className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
      >
        <FileText size={12} />
        Notes
      </Link>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
