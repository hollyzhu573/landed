import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import type { Job, Contact, ContactStatus } from '@/src/lib/types'
import { Briefcase, Users, AlertCircle } from 'lucide-react'
import QuickApply from '@/src/app/dashboard/_components/QuickApply'
import SuggestionsWidget from '@/src/app/dashboard/_components/SuggestionsWidget'
import FollowUpCalendar from '@/src/app/dashboard/_components/FollowUpCalendar'
import { generateSuggestions } from '@/src/lib/suggestions'

const CONTACT_STATUS_STYLES: Record<ContactStatus, string> = {
  to_reach_out: 'bg-[var(--color-stone)] text-[var(--color-stone-text)]',
  reached_out:  'bg-[var(--color-sky-light)] text-[var(--color-sky-text)]',
  following_up: 'bg-[var(--color-honey-light)] text-[var(--color-honey-text)]',
  connected:    'bg-[var(--color-sage-light)] text-[var(--color-sage-text)]',
  dormant:      'bg-[var(--color-stone)] text-[var(--color-text-tertiary)]',
}

const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  to_reach_out: 'To reach out',
  reached_out:  'Reached out',
  following_up: 'Following up',
  connected:    'Connected',
  dormant:      'Dormant',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function daysOverdue(dueDateStr: string): number {
  const due = new Date(dueDateStr)
  const today = new Date()
  due.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  cardClass = 'border-[#DDDBD2] bg-white hover:bg-[var(--color-stone)]',
  valueClass = 'text-zinc-900',
  iconColor = 'text-zinc-300 group-hover:text-zinc-400',
}: {
  label: string
  value: number
  icon: React.ElementType
  href: string
  cardClass?: string
  valueClass?: string
  iconColor?: string
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-xl border px-5 py-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm ${cardClass}`}
    >
      <div>
        <p className="text-[11px] font-semibold text-zinc-500 tracking-wide">{label}</p>
        <p className={`mt-1.5 text-[2.25rem] font-bold leading-none tracking-tight font-mono ${valueClass}`}>{value}</p>
      </div>
      <Icon size={20} className={`transition-colors ${iconColor}`} />
    </Link>
  )
}


function ContactStatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTACT_STATUS_STYLES[status]}`}>
      {CONTACT_STATUS_LABELS[status]}
    </span>
  )
}

// ── Encouragement message ──────────────────────────────────────────────────

function getDashboardMessage(jobs: Job[]): { headline: string; sub: string } {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const total = jobs.length
  const appliedToday = jobs.filter((j) => j.date_applied === today).length
  const appliedThisWeek = jobs.filter((j) => j.date_applied && j.date_applied >= weekAgo).length

  if (appliedToday > 0) return {
    headline: "You showed up today.",
    sub: "That's genuinely all this takes — keep going at whatever pace works for you.",
  }
  if (appliedThisWeek >= 3) return {
    headline: "You've been consistent this week.",
    sub: "Consistency is the only thing you can actually control. You're doing it.",
  }
  if (total >= 20) return {
    headline: "You've applied to a lot of places.",
    sub: "That's a lot of courage in a row. The right one is in there somewhere.",
  }
  if (total >= 10) return {
    headline: `${total} applications out in the world.`,
    sub: "Each one is a real shot. You're doing the work — that's what matters.",
  }
  if (total >= 1) return {
    headline: "You've put yourself out there.",
    sub: "That's the hardest part. Keep adding to it whenever you're ready.",
  }
  return {
    headline: "No pressure. Just paste a link when you're ready.",
    sub: "This is your space to track everything in one place.",
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: jobs, error: jobsErr }, { data: contacts, error: contactsErr }] =
    await Promise.all([
      supabase.from('jobs').select('*').order('created_at', { ascending: false }).returns<Job[]>(),
      supabase.from('contacts').select('*').order('follow_up_due', { ascending: true }).returns<Contact[]>(),
    ])

  const dbError = jobsErr ?? contactsErr ?? null

  const allJobs = jobs ?? []
  const allContacts = contacts ?? []
  const { headline, sub } = getDashboardMessage(allJobs)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const activeJobs = allJobs.filter((j) =>
    ['applied', 'interviewing', 'offer'].includes(j.status)
  )
  const suggestions = generateSuggestions(allJobs, allContacts, todayStr)

  const followUpsDue = allContacts.filter(
    (c) => c.follow_up_due && c.follow_up_due <= todayStr && c.status !== 'dormant'
  )
  const activeContacts = allContacts.filter((c) =>
    ['to_reach_out', 'reached_out', 'following_up', 'connected'].includes(c.status)
  )

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">

      <QuickApply headline={headline} sub={sub} />

      {/* DB error banner */}
      {dbError && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0 text-red-400" />
          <span>Could not reach the database — data may be unavailable. ({dbError.message})</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        {([
          {
            label: 'Applications', value: allJobs.length, icon: Briefcase, href: '/jobs',
            cardClass: 'bg-[var(--color-sky-light)] border-[var(--color-sky-border)] hover:border-[var(--color-sky)]',
            valueClass: 'text-[var(--color-sky-text)]',
            iconColor: 'text-[var(--color-sky)] opacity-60 group-hover:opacity-100',
          },
          {
            label: 'Active pipeline', value: activeJobs.length, icon: Briefcase, href: '/jobs',
            cardClass: 'bg-[var(--color-lavender-light)] border-[var(--color-lavender-border)] hover:border-[var(--color-lavender)]',
            valueClass: 'text-[var(--color-lavender-text)]',
            iconColor: 'text-[var(--color-lavender)] opacity-60 group-hover:opacity-100',
          },
          {
            label: 'Contacts', value: activeContacts.length, icon: Users, href: '/networking',
            cardClass: 'bg-[var(--color-sage-light)] border-[var(--color-sage-border)] hover:border-[var(--color-sage)]',
            valueClass: 'text-[var(--color-sage-text)]',
            iconColor: 'text-[var(--color-sage)] opacity-60 group-hover:opacity-100',
          },
        ]).map((card, i) => (
          <div
            key={card.label}
            style={{ animation: 'fade-up 0.4s ease-out both', animationDelay: `${i * 80}ms` }}
          >
            <StatCard {...card} />
          </div>
        ))}
      </div>

      {/* Follow-ups due */}
      {followUpsDue.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2.5">
            <AlertCircle size={14} className="text-[var(--color-honey)]" />
            <h2 className="text-[13px] font-semibold text-zinc-900">
              Follow-ups due
            </h2>
            <span className="rounded-full bg-[var(--color-honey-light)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-honey-text)]">
              {followUpsDue.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--color-honey-border)] bg-white">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100">
                {followUpsDue.map((contact) => {
                  const overdueDays = contact.follow_up_due ? daysOverdue(contact.follow_up_due) : 0
                  return (
                    <tr key={contact.id} className="transition-colors hover:bg-zinc-50">
                      <td className="px-6 py-3.5 font-medium text-zinc-900">{contact.name}</td>
                      <td className="px-6 py-3.5 text-zinc-500">
                        {contact.role && contact.company
                          ? `${contact.role} @ ${contact.company}`
                          : contact.company ?? contact.role ?? '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        <ContactStatusBadge status={contact.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right text-xs">
                        {overdueDays === 0 ? (
                          <span className="font-medium text-[var(--color-honey-text)]">Due today</span>
                        ) : (
                          <span className="font-medium text-[var(--color-peach-text)]">{overdueDays}d overdue</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex items-start gap-8">

        <div className="min-w-0 flex-1">
          <SuggestionsWidget suggestions={suggestions} />
        </div>

        {/* Follow-up calendar */}
        <section className="w-64 shrink-0">
          <h2 className="mb-4 text-[13px] font-semibold text-zinc-900">Follow-ups</h2>
          <FollowUpCalendar contacts={allContacts} />
        </section>

      </div>
    </div>
  )
}
