'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import type { JobStatus } from '@/src/lib/types'

const JOB_STATUSES: JobStatus[] = [
  'wishlist', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn',
]

type State = { error: string } | undefined

export async function createJob(_prevState: State, formData: FormData) {
  const company = formData.get('company')
  const role = formData.get('role')
  const status = formData.get('status')

  if (
    typeof company !== 'string' || !company.trim() ||
    typeof role !== 'string' || !role.trim() ||
    typeof status !== 'string' || !JOB_STATUSES.includes(status as JobStatus)
  ) {
    return { error: 'Company, role, and a valid status are required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('jobs').insert({
    company:      company.trim(),
    role:         role.trim(),
    status:       status as JobStatus,
    date_applied: formData.get('date_applied') || null,
    location:     formData.get('location') || null,
    job_url:      formData.get('job_url') || null,
    notes:        formData.get('notes') || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/jobs')
  redirect('/jobs')
}

export async function deleteJob(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('jobs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/jobs')
}

export async function updateJob(id: string, _prevState: State, formData: FormData) {
  const company = formData.get('company')
  const role = formData.get('role')
  const status = formData.get('status')

  if (
    typeof company !== 'string' || !company.trim() ||
    typeof role !== 'string' || !role.trim() ||
    typeof status !== 'string' || !JOB_STATUSES.includes(status as JobStatus)
  ) {
    return { error: 'Company, role, and a valid status are required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('jobs').update({
    company:      company.trim(),
    role:         role.trim(),
    status:       status as JobStatus,
    date_applied: formData.get('date_applied') || null,
    location:     formData.get('location') || null,
    job_url:      formData.get('job_url') || null,
    notes:        formData.get('notes') || null,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/jobs')
  redirect('/jobs')
}

export async function updateJobField(
  id: string,
  field: 'company' | 'role' | 'date_applied',
  value: string | null,
) {
  if (field !== 'date_applied' && (typeof value !== 'string' || !value.trim())) {
    throw new Error(`${field} cannot be empty.`)
  }
  const supabase = await createClient()
  const { error } = await supabase.from('jobs').update({ [field]: value }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/jobs')
}

export async function saveJobFields(
  id: string,
  updates: Partial<{
    company: string
    role: string
    status: JobStatus
    date_applied: string | null
    location: string | null
    job_url: string | null
    notes: string | null
  }>,
) {
  if ('company' in updates && !updates.company?.trim()) throw new Error('Company cannot be empty.')
  if ('role'    in updates && !updates.role?.trim())    throw new Error('Role cannot be empty.')
  const supabase = await createClient()
  const { error } = await supabase
    .from('jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/jobs')
  revalidatePath('/dashboard')
}

export async function updateJobStatus(id: string, status: JobStatus) {
  const supabase = await createClient()
  const { error } = await supabase.from('jobs').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/jobs')
}

export async function quickAddJob(fields: {
  company: string
  role: string
  location: string | null
  job_url: string
}): Promise<{ company: string; role: string }> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('jobs').insert({
    company:      fields.company,
    role:         fields.role,
    status:       'applied' as JobStatus,
    date_applied: today,
    location:     fields.location,
    job_url:      fields.job_url,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/jobs')
  revalidatePath('/dashboard')
  return { company: fields.company, role: fields.role }
}
