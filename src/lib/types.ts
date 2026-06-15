export type JobStatus =
  | 'wishlist'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn'

export type ContactStatus =
  | 'to_reach_out'
  | 'reached_out'
  | 'following_up'
  | 'connected'
  | 'dormant'

export type Job = {
  id: string
  company: string
  role: string
  status: JobStatus
  date_applied: string | null
  interview_date: string | null
  location: string | null
  job_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type MeetingKind = 'touchpoint'

export type ContactNote = {
  id: string
  contact_id: string
  kind: MeetingKind
  content: string
  freeform_note: string
  meeting_date: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type ResumeExperience = {
  company: string
  role: string
  start_date: string | null
  end_date: string | null
  bullets: string[]
}

export type ResumeEducation = {
  school: string
  degree: string | null
  field: string | null
  graduation_year: string | null
}

export type UserProfile = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  summary: string | null
  skills: string[]
  tools: string[]
  experience: ResumeExperience[]
  education: ResumeEducation[]
  resume_filename: string | null
  created_at: string
  updated_at: string
}

export type PrepCategory = 'behavioral' | 'portfolio' | 'case_study' | 'technical' | 'other'

export type QuestionBankEntry = {
  id: string
  question: string
  answer: string
  category: PrepCategory | null
  source: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type JobPrepQuestion = {
  id: string
  job_id: string
  question: string
  answer: string
  category: PrepCategory
  rationale: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type Contact = {
  id: string
  name: string
  company: string | null
  role: string | null
  linkedin_url: string | null
  how_we_met: string | null
  last_contact_date: string | null
  follow_up_days: number | null
  follow_up_due: string | null  // computed column, read-only
  status: ContactStatus
  notes: string | null
  job_id: string | null
  created_at: string
  updated_at: string
}
