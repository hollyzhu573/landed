'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import type { MeetingKind, ContactNote } from '@/src/lib/types'

export async function createContactNote(
  contactId: string,
  kind: MeetingKind,
  sortOrder: number,
): Promise<ContactNote> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_notes')
    .insert({ contact_id: contactId, kind, content: '', freeform_note: '', sort_order: sortOrder })
    .select()
    .single<ContactNote>()
  if (error) throw new Error(error.message)
  return data
}

export async function updateContactNote(id: string, content: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('contact_notes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateContactNoteFreeform(id: string, freeformNote: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('contact_notes')
    .update({ freeform_note: freeformNote, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateContactNoteDate(
  id: string,
  contactId: string,
  meetingDate: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('contact_notes')
    .update({ meeting_date: meetingDate, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)

  // Recalculate last_contact_date from all touchpoints for this contact
  const { data: allNotes } = await supabase
    .from('contact_notes')
    .select('meeting_date')
    .eq('contact_id', contactId)
    .not('meeting_date', 'is', null)

  const mostRecent = allNotes
    ?.map(n => n.meeting_date as string)
    .sort()
    .at(-1) ?? null

  await supabase
    .from('contacts')
    .update({ last_contact_date: mostRecent, updated_at: new Date().toISOString() })
    .eq('id', contactId)

  revalidatePath('/networking')
  revalidatePath('/dashboard')
}

export async function deleteContactNote(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('contact_notes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
