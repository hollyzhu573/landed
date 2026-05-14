import type { Job, Contact } from '@/src/lib/types'

export type SuggestionKind = 'celebration' | 'warning' | 'nudge' | 'tip'

export type Suggestion = {
  id: string
  kind: SuggestionKind
  title: string
  body: string
  href?: string
}

function daysBetween(a: string, b: string) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24))
}

export function generateSuggestions(jobs: Job[], contacts: Contact[], today: string): Suggestion[] {
  const suggestions: Suggestion[] = []

  const applied      = jobs.filter(j => j.status === 'applied')
  const interviewing = jobs.filter(j => j.status === 'interviewing')
  const offers       = jobs.filter(j => j.status === 'offer')
  const wishlist     = jobs.filter(j => j.status === 'wishlist')
  const rejected     = jobs.filter(j => j.status === 'rejected')

  const weekAgo      = new Date(Date.now() - 7  * 864e5).toISOString().split('T')[0]
  const twoWeeksAgo  = new Date(Date.now() - 14 * 864e5).toISOString().split('T')[0]

  // ── Celebrations ──────────────────────────────────────────────────────────

  if (offers.length > 0) {
    suggestions.push({
      id: 'offer',
      kind: 'celebration',
      title: `You have ${offers.length === 1 ? 'an offer' : `${offers.length} offers`} on the table.`,
      body: `${offers.map(j => j.company).join(', ')}. Take your time, ask questions, and don't be afraid to negotiate — it's expected.`,
      href: '/jobs',
    })
  }

  if (jobs.length === 1) {
    suggestions.push({
      id: 'first-app',
      kind: 'celebration',
      title: 'First one logged.',
      body: "That's always the hardest. You've started — now it's just about adding to it.",
    })
  }

  if (jobs.length === 10) {
    suggestions.push({
      id: 'ten-apps',
      kind: 'celebration',
      title: '10 applications. Seriously.',
      body: "That's real effort. Most people quit before this. Keep going — the law of large numbers is on your side.",
    })
  }

  // ── Warnings ──────────────────────────────────────────────────────────────

  // Stale applications — applied 14+ days ago, no movement
  const stale = applied.filter(j => j.date_applied && j.date_applied <= twoWeeksAgo)
  if (stale.length > 0) {
    const names = stale.slice(0, 2).map(j => j.company).join(', ')
    const extra = stale.length > 2 ? ` and ${stale.length - 2} more` : ''
    suggestions.push({
      id: 'stale',
      kind: 'warning',
      title: `${stale.length} application${stale.length > 1 ? 's' : ''} with no movement in 2+ weeks.`,
      body: `${names}${extra}. A short, genuine follow-up can put you back on the radar.`,
      href: '/jobs',
    })
  }

  // Overdue networking follow-ups
  const overdueContacts = contacts.filter(
    c => c.follow_up_due && c.follow_up_due < today && c.status !== 'dormant'
  )
  if (overdueContacts.length > 0) {
    suggestions.push({
      id: 'overdue-followup',
      kind: 'warning',
      title: `${overdueContacts.length} networking follow-up${overdueContacts.length > 1 ? 's' : ''} overdue.`,
      body: `${overdueContacts[0].name}${overdueContacts.length > 1 ? ` and ${overdueContacts.length - 1} others` : ''} — a two-line message goes a long way.`,
      href: '/networking',
    })
  }

  // High rejection rate with little active pipeline
  const activeCount = applied.length + interviewing.length + offers.length
  if (rejected.length >= 5 && activeCount < 3) {
    suggestions.push({
      id: 'high-rejection',
      kind: 'warning',
      title: 'Your active pipeline is looking thin.',
      body: `${rejected.length} rejections and only ${activeCount} active application${activeCount !== 1 ? 's' : ''}. Consider widening the net — adjacent roles, smaller studios, or contract work can open doors.`,
      href: '/jobs',
    })
  }

  // ── Nudges ────────────────────────────────────────────────────────────────

  // No activity this week
  const appliedThisWeek = jobs.filter(j => j.date_applied && j.date_applied >= weekAgo)
  if (jobs.length > 0 && appliedThisWeek.length === 0) {
    const daysSinceLast = jobs[0]?.date_applied ? daysBetween(jobs[0].date_applied, today) : null
    suggestions.push({
      id: 'no-activity',
      kind: 'nudge',
      title: daysSinceLast && daysSinceLast > 14
        ? `It's been ${daysSinceLast} days since your last application.`
        : "Nothing new logged this week.",
      body: "Consistency matters more than volume. Even one application keeps the habit alive.",
      href: '/jobs/new',
    })
  }

  // Wishlist jobs sitting unacted on
  if (wishlist.length >= 3) {
    suggestions.push({
      id: 'wishlist-sitting',
      kind: 'nudge',
      title: `${wishlist.length} jobs on your wishlist, none applied.`,
      body: "Your portfolio is good enough to get a response. Pick one and send it.",
      href: '/jobs',
    })
  }

  // No networking contacts added
  if (jobs.length >= 3 && contacts.length === 0) {
    suggestions.push({
      id: 'no-contacts',
      kind: 'nudge',
      title: "You haven't tracked any networking yet.",
      body: "A warm intro converts 4–5× better than a cold apply. Even one message a week adds up.",
      href: '/networking/new',
    })
  }

  // ── Tips ──────────────────────────────────────────────────────────────────

  // In interviewing stage — prep reminder
  if (interviewing.length > 0) {
    const companies = interviewing.slice(0, 2).map(j => j.company).join(' and ')
    suggestions.push({
      id: 'interview-prep',
      kind: 'tip',
      title: `You're interviewing at ${companies}${interviewing.length > 2 ? ` (+${interviewing.length - 2})` : ''}.`,
      body: "Now's the time to prep case studies and portfolio walk-throughs. Research the team and product deeply — interviewers notice.",
    })
  }

  // Applied to many places, no networking
  if (applied.length >= 5 && contacts.length < 2) {
    suggestions.push({
      id: 'apply-network-balance',
      kind: 'tip',
      title: "You're applying a lot but not networking much.",
      body: "Try finding one person at each company you care about most. A brief, honest message on LinkedIn can move your application from pile to priority.",
      href: '/networking/new',
    })
  }


  // Empty state tip
  if (jobs.length === 0) {
    suggestions.push({
      id: 'empty',
      kind: 'tip',
      title: "Start by logging a job you're excited about.",
      body: "Paste the URL above and we'll fill in the details. Even your reach companies are worth tracking — you'd be surprised.",
    })
  }

  // ── Sort by priority: celebration > warning > nudge > tip ─────────────────
  const order: Record<SuggestionKind, number> = { celebration: 0, warning: 1, nudge: 2, tip: 3 }
  return suggestions.sort((a, b) => order[a.kind] - order[b.kind]).slice(0, 3)
}
