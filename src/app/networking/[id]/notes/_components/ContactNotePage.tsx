'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Check } from 'lucide-react'
import { saveContactFields } from '@/src/app/networking/actions'
import type { Contact, ContactNote, ContactStatus } from '@/src/lib/types'
import MeetingCanvas from './MeetingCanvas'
import ContactSummary from './ContactSummary'

const STATUSES: { value: ContactStatus; label: string }[] = [
  { value: 'to_reach_out', label: 'To reach out' },
  { value: 'reached_out',  label: 'Reached out' },
  { value: 'following_up', label: 'Following up' },
  { value: 'connected',    label: 'Connected' },
  { value: 'dormant',      label: 'Dormant' },
]

const STATUS_STYLES: Record<ContactStatus, string> = {
  to_reach_out: 'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
  reached_out:  'bg-[var(--color-sky-light)] text-[var(--color-sky-text)]',
  following_up: 'bg-[var(--color-honey-light)] text-[var(--color-honey-text)]',
  connected:    'bg-[var(--color-sage-light)] text-[var(--color-sage-text)]',
  dormant:      'bg-[var(--color-stone)] text-[var(--color-text-tertiary)]',
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-1.5">
      <span className="w-36 shrink-0 pt-px text-sm text-zinc-400">{label}</span>
      <div className="flex-1 text-sm text-zinc-700">{children}</div>
    </div>
  )
}

export default function ContactNotePage({ contact, initialNotes }: { contact: Contact; initialNotes: ContactNote[] }) {
  const [name,            setName]          = useState(contact.name)
  const [company,         setCompany]       = useState(contact.company ?? '')
  const [role,            setRole]          = useState(contact.role ?? '')
  const [linkedinUrl,     setLinkedinUrl]   = useState(contact.linkedin_url ?? '')
  const [howWeMet,        setHowWeMet]      = useState(contact.how_we_met ?? '')
  const [lastContactDate, setLastContact]   = useState(contact.last_contact_date ?? '')
  const [followUpDays,    setFollowUpDays]  = useState(contact.follow_up_days?.toString() ?? '')
  const [status,          setStatus]        = useState<ContactStatus>(contact.status)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const save = useCallback(async (updates: Parameters<typeof saveContactFields>[1]) => {
    setSaveState('saving')
    try {
      await saveContactFields(contact.id, updates)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }, [contact.id])

  function handleStatusChange(next: ContactStatus) {
    setStatus(next)
    save({ status: next })
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10 pb-[100vh]">

      {/* Top bar */}
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/networking"
          className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft size={14} />
          Networking
        </Link>

        <span className="text-xs transition-opacity duration-300" style={{ opacity: saveState === 'idle' ? 0 : 1 }}>
          {saveState === 'saving' && <span className="text-zinc-400">Saving…</span>}
          {saveState === 'saved'  && <span className="flex items-center gap-1 text-zinc-400"><Check size={11} /> Saved</span>}
          {saveState === 'error'  && <span className="text-red-400">Couldn't save — check your connection</span>}
        </span>
      </div>

      {/* Status pill */}
      <div className="mb-5">
        <select
          value={status}
          onChange={e => handleStatusChange(e.target.value as ContactStatus)}
          className={`cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-300 ${STATUS_STYLES[status]}`}
        >
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Name */}
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={() => { if (name.trim() && name !== contact.name) save({ name }) }}
        placeholder="Name"
        className="w-full bg-transparent text-4xl font-bold tracking-tight text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
      />

      {/* Role @ Company */}
      <div className="mt-2 flex items-center gap-1.5">
        <input
          value={role}
          onChange={e => setRole(e.target.value)}
          onBlur={() => save({ role: role || null })}
          placeholder="Role"
          className="bg-transparent text-xl text-zinc-400 placeholder:text-zinc-300 focus:outline-none"
        />
        {(role || company) && <span className="text-xl text-zinc-300">@</span>}
        <input
          value={company}
          onChange={e => setCompany(e.target.value)}
          onBlur={() => save({ company: company || null })}
          placeholder="Company"
          className="bg-transparent text-xl text-zinc-400 placeholder:text-zinc-300 focus:outline-none"
        />
      </div>

      {/* Properties */}
      <div className="mt-8 border-t border-zinc-100 pt-6">
        <Property label="LinkedIn">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={linkedinUrl}
              onChange={e => setLinkedinUrl(e.target.value)}
              onBlur={() => save({ linkedin_url: linkedinUrl || null })}
              placeholder="https://linkedin.com/in/…"
              className="flex-1 bg-transparent placeholder:text-zinc-300 focus:outline-none"
            />
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-zinc-300 transition-colors hover:text-zinc-600"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </Property>

        <Property label="How we met">
          <input
            type="text"
            value={howWeMet}
            onChange={e => setHowWeMet(e.target.value)}
            onBlur={() => save({ how_we_met: howWeMet || null })}
            placeholder="e.g. Design conf, mutual friend…"
            className="w-full bg-transparent placeholder:text-zinc-300 focus:outline-none"
          />
        </Property>

        <Property label="Last contact">
          <input
            type="date"
            value={lastContactDate}
            onChange={e => setLastContact(e.target.value)}
            onBlur={() => save({ last_contact_date: lastContactDate || null })}
            className="bg-transparent focus:outline-none"
          />
        </Property>

        <Property label="Follow-up every">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              value={followUpDays}
              onChange={e => setFollowUpDays(e.target.value)}
              onBlur={() => save({ follow_up_days: followUpDays ? Number(followUpDays) : null })}
              placeholder="7"
              className="w-16 bg-transparent placeholder:text-zinc-300 focus:outline-none"
            />
            <span className="text-zinc-400">days</span>
          </div>
        </Property>
      </div>

      {/* Meeting notes canvas */}
      <div className="mt-8 border-t border-zinc-100 pt-8">
        <p className="mb-4 text-[13px] font-semibold text-zinc-900">Meeting notes</p>
        <ContactSummary name={name} notes={initialNotes} />
        <MeetingCanvas contactId={contact.id} initialNotes={initialNotes} />
      </div>

    </div>
  )
}
