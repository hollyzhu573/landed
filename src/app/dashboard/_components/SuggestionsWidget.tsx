import Link from 'next/link'
import { ArrowRight, Trophy, AlertTriangle, Zap, Lightbulb } from 'lucide-react'
import type { Suggestion, SuggestionKind } from '@/src/lib/suggestions'

const KIND_STYLES: Record<SuggestionKind, {
  bar: string
  iconBg: string
  icon: React.ElementType
  iconColor: string
}> = {
  celebration: {
    bar:      'bg-[var(--color-sage)]',
    iconBg:   'bg-[var(--color-sage-light)]',
    icon:     Trophy,
    iconColor:'text-[var(--color-sage-text)]',
  },
  warning: {
    bar:      'bg-[var(--color-peach)]',
    iconBg:   'bg-[var(--color-peach-light)]',
    icon:     AlertTriangle,
    iconColor:'text-[var(--color-peach-text)]',
  },
  nudge: {
    bar:      'bg-[var(--color-honey)]',
    iconBg:   'bg-[var(--color-honey-light)]',
    icon:     Zap,
    iconColor:'text-[var(--color-honey-text)]',
  },
  tip: {
    bar:      'bg-[var(--color-lavender)]',
    iconBg:   'bg-[var(--color-lavender-light)]',
    icon:     Lightbulb,
    iconColor:'text-[var(--color-lavender-text)]',
  },
}

function SuggestionCard({ s }: { s: Suggestion }) {
  const style = KIND_STYLES[s.kind]
  const Icon  = style.icon

  const content = (
    <div className="group flex gap-4 rounded-xl border border-[#DDDBD2] bg-white px-5 py-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}>
        <Icon size={14} className={style.iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900">{s.title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{s.body}</p>
      </div>
      {s.href && (
        <ArrowRight
          size={15}
          className="mt-1 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500"
        />
      )}
    </div>
  )

  return s.href ? (
    <Link href={s.href} className="block">
      {content}
    </Link>
  ) : (
    <div>{content}</div>
  )
}

export default function SuggestionsWidget({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <section>
      <h2 className="mb-4 text-[13px] font-semibold text-zinc-900">For you</h2>
      <div className="space-y-3">
        {suggestions.map(s => (
          <SuggestionCard key={s.id} s={s} />
        ))}
      </div>
    </section>
  )
}
