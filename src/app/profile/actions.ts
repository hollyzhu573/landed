'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import type { UserProfile, ResumeExperience, ResumeEducation } from '@/src/lib/types'

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[profile] getProfile error:', error)
    return null
  }
  return data as UserProfile | null
}

export type ParsedResumeData = {
  name?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  linkedin_url?: string | null
  portfolio_url?: string | null
  summary?: string | null
  skills?: string[]
  tools?: string[]
  experience?: ResumeExperience[]
  education?: ResumeEducation[]
  resume_filename?: string | null
}

export async function saveProfile(data: ParsedResumeData): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Check if a profile already exists
  const { data: existing } = await supabase
    .from('user_profile')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('user_profile')
      .update({
        name: data.name ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        location: data.location ?? null,
        linkedin_url: data.linkedin_url ?? null,
        portfolio_url: data.portfolio_url ?? null,
        summary: data.summary ?? null,
        skills: data.skills ?? [],
        tools: data.tools ?? [],
        experience: data.experience ?? [],
        education: data.education ?? [],
        resume_filename: data.resume_filename ?? null,
      })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('user_profile').insert({
      name: data.name ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      location: data.location ?? null,
      linkedin_url: data.linkedin_url ?? null,
      portfolio_url: data.portfolio_url ?? null,
      summary: data.summary ?? null,
      skills: data.skills ?? [],
      tools: data.tools ?? [],
      experience: data.experience ?? [],
      education: data.education ?? [],
      resume_filename: data.resume_filename ?? null,
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/profile')
  return {}
}
