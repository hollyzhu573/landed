'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import type { ContactStatus } from '@/src/lib/types'

const CONTACT_STATUSES: ContactStatus[] = [
  'to_reach_out', 'reached_out', 'following_up', 'connected', 'dormant',
]

type State = { error: string } | undefined

export async function updateContactField(
  id: string,
  field: 'name' | 'last_contact_date',
  value: string | null,
) {
  if (field === 'name' && (typeof value !== 'string' || !value.trim())) {
    throw new Error('Name cannot be empty.')
  }
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').update({ [field]: value }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/networking')
  revalidatePath('/dashboard')
}

export async function updateContactStatus(id: string, status: ContactStatus) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/networking')
  revalidatePath('/dashboard')
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/networking')
  revalidatePath('/dashboard')
}

export async function saveContactFields(
  id: string,
  updates: Partial<{
    name: string
    company: string | null
    role: string | null
    linkedin_url: string | null
    how_we_met: string | null
    last_contact_date: string | null
    follow_up_days: number | null
    status: ContactStatus
    notes: string | null
  }>,
) {
  if ('name' in updates && !updates.name?.trim()) throw new Error('Name cannot be empty.')
  const supabase = await createClient()
  const { error } = await supabase
    .from('contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/networking')
  revalidatePath('/dashboard')
}

export async function createContact(_prevState: State, formData: FormData) {
  const name = formData.get('name')
  const status = formData.get('status')

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof status !== 'string' || !CONTACT_STATUSES.includes(status as ContactStatus)
  ) {
    return { error: 'Name and a valid status are required.' }
  }

  const followUpDays = formData.get('follow_up_days')

  const supabase = await createClient()
  const { error } = await supabase.from('contacts').insert({
    name:               name.trim(),
    status:             status as ContactStatus,
    company:            formData.get('company') || null,
    role:               formData.get('role') || null,
    linkedin_url:       formData.get('linkedin_url') || null,
    how_we_met:         formData.get('how_we_met') || null,
    last_contact_date:  formData.get('last_contact_date') || null,
    follow_up_days:     followUpDays ? Number(followUpDays) : null,
    notes:              formData.get('notes') || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/networking')
  redirect('/networking')
}
