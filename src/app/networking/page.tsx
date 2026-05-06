import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import type { Contact } from '@/src/lib/types'
import ContactInlineEditCell from '@/src/app/networking/_components/ContactInlineEditCell'
import ContactStatusSelect from '@/src/app/networking/_components/ContactStatusSelect'
import ContactRowActions from '@/src/app/networking/_components/ContactRowActions'

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

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
        <div className="overflow-hidden rounded-xl border border-[#DDDBD2] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/70 text-left text-[11px] font-semibold text-zinc-400">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Company / Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last contact</th>
                <th className="px-6 py-3">Follow-up due</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className="group transition-colors hover:bg-zinc-50">
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
      )}
    </div>
  )
}
