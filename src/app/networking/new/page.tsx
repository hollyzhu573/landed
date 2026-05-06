import Link from 'next/link'
import NewContactForm from './_components/new-contact-form'

export default function NewContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/networking"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-600"
        >
          ← Networking
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Add contact</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <NewContactForm />
      </div>
    </div>
  )
}
