import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import type { Contact, ContactNote } from '@/src/lib/types'
import ContactNotePage from './_components/ContactNotePage'

export default async function ContactNotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: contact, error }, { data: notes }] = await Promise.all([
    supabase.from('contacts').select('*').eq('id', id).single<Contact>(),
    supabase
      .from('contact_notes')
      .select('*')
      .eq('contact_id', id)
      .order('sort_order', { ascending: true })
      .returns<ContactNote[]>(),
  ])

  if (error || !contact) notFound()

  return <ContactNotePage contact={contact} initialNotes={notes ?? []} />
}
