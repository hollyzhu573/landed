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
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Link
        href={`/jobs/${id}/edit`}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        <FileText size={13} />
        Notes
      </Link>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
