'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createContact } from '@/src/app/networking/actions'

const STATUSES = [
  { value: 'to_reach_out',  label: 'To reach out' },
  { value: 'reached_out',   label: 'Reached out' },
  { value: 'following_up',  label: 'Following up' },
  { value: 'connected',     label: 'Connected' },
  { value: 'dormant',       label: 'Dormant' },
]

export default function NewContactForm() {
  const [state, action, pending] = useActionState(createContact, undefined)

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Required fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jane Smith"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium text-zinc-700">
            Status <span className="text-red-400">*</span>
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue="to_reach_out"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional fields */}
      <div className="border-t border-zinc-100 pt-6">
        <p className="mb-5 text-xs font-medium uppercase tracking-wider text-zinc-400">Optional</p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="company" className="block text-sm font-medium text-zinc-700">Company</label>
            <input
              id="company"
              name="company"
              type="text"
              placeholder="Figma"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="role" className="block text-sm font-medium text-zinc-700">Role</label>
            <input
              id="role"
              name="role"
              type="text"
              placeholder="Design Manager"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="linkedin_url" className="block text-sm font-medium text-zinc-700">LinkedIn</label>
            <input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              placeholder="https://linkedin.com/in/..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="how_we_met" className="block text-sm font-medium text-zinc-700">How we met</label>
            <input
              id="how_we_met"
              name="how_we_met"
              type="text"
              placeholder="Design conference, cold DM…"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="last_contact_date" className="block text-sm font-medium text-zinc-700">Last contact date</label>
            <input
              id="last_contact_date"
              name="last_contact_date"
              type="date"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="follow_up_days" className="block text-sm font-medium text-zinc-700">
              Follow up after
            </label>
            <div className="flex items-center gap-2">
              <input
                id="follow_up_days"
                name="follow_up_days"
                type="number"
                min="1"
                placeholder="14"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
              <span className="shrink-0 text-sm text-zinc-400">days</span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">Notes</label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Topics discussed, next steps, mutual connections…"
            className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-6">
        <Link
          href="/networking"
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save contact'}
        </button>
      </div>
    </form>
  )
}
