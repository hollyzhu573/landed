import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import type { Contact } from '@/src/lib/types'
import ContactsTable from '@/src/app/networking/_components/ContactsTable'

export default async function NetworkingPage() {
  const supabase = await createClient()
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Contact[]>()

  if (error) throw new Error(error.message)

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">Networking</h1>
          <p className="mt-1 font-mono text-[12px] text-zinc-400">
            {contacts?.length ?? 0} contact{contacts?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/networking/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Add contact
        </Link>
      </div>

      {!contacts?.length ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-20 text-center">
          <p className="text-sm text-zinc-400">No contacts yet.</p>
          <Link href="/networking/new" className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2">
            Add your first contact
          </Link>
        </div>
      ) : (
        <ContactsTable contacts={contacts} />
      )}
    </div>
  )
}
