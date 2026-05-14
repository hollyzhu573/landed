'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { Contact, ContactStatus } from '@/src/lib/types'
import ContactInlineEditCell from './ContactInlineEditCell'
import ContactStatusSelect from './ContactStatusSelect'
import ContactRowActions from './ContactRowActions'

type SortKey = 'name' | 'company' | 'status' | 'last_contact_date' | 'follow_up_due'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<ContactStatus, number> = {
  to_reach_out: 0, reached_out: 1, following_up: 2, connected: 3, dormant: 4,
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function sortContacts(contacts: Contact[], key: SortKey, dir: SortDir): Contact[] {
  return [...contacts].sort((a, b) => {
    let cmp = 0
    if (key === 'status') {
      cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    } else if (key === 'last_contact_date' || key === 'follow_up_due') {
      const da = a[key] ?? ''
      const db = b[key] ?? ''
      // nulls last regardless of direction
      if (!da && !db) cmp = 0
      else if (!da) return 1
      else if (!db) return -1
      else cmp = da < db ? -1 : da > db ? 1 : 0
    } else if (key === 'company') {
      const va = ((a.company ?? '') + ' ' + (a.role ?? '')).toLowerCase()
      const vb = ((b.company ?? '') + ' ' + (b.role ?? '')).toLowerCase()
      cmp = va < vb ? -1 : va > vb ? 1 : 0
    } else {
      const va = (a[key] ?? '').toLowerCase()
      const vb = (b[key] ?? '').toLowerCase()
      cmp = va < vb ? -1 : va > vb ? 1 : 0
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp size={11} className="opacity-0 group-hover/th:opacity-30" />
  return sortDir === 'asc'
    ? <ChevronUp size={11} className="opacity-70" />
    : <ChevronDown size={11} className="opacity-70" />
}

export default function ContactsTable({ contacts: initialContacts }: { contacts: Contact[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('last_contact_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const contacts = sortContacts(initialContacts, sortKey, sortDir)

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
            {th('name', 'Name')}
            {th('company', 'Company / Role')}
            {th('status', 'Status')}
            {th('last_contact_date', 'Last contact')}
            {th('follow_up_due', 'Follow-up due')}
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {contacts.map((contact) => (
            <tr key={contact.id} className="transition-colors hover:bg-zinc-50">
              <td className="px-6 py-4 font-medium text-zinc-900">
                <ContactInlineEditCell id={contact.id} field="name" value={contact.name} />
              </td>
              <td className="px-6 py-4 text-zinc-600">
                {contact.company && contact.role
                  ? `${contact.company} · ${contact.role}`
                  : contact.company ?? contact.role ?? '—'}
              </td>
              <td className="px-6 py-4">
                <ContactStatusSelect id={contact.id} status={contact.status} />
              </td>
              <td className="px-6 py-4 font-mono text-[12px] text-zinc-400">
                <ContactInlineEditCell
                  id={contact.id}
                  field="last_contact_date"
                  value={contact.last_contact_date}
                  display={formatDate(contact.last_contact_date) ?? undefined}
                  type="date"
                />
              </td>
              <td className="px-6 py-4 font-mono text-[12px] text-zinc-400">
                {formatDate(contact.follow_up_due) ?? <span className="text-zinc-300">—</span>}
              </td>
              <td className="px-4 py-4">
                <ContactRowActions id={contact.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
