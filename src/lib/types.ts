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
  location: string | null
  job_url: string | null
  portfolio_link: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type PrepCategory =
  | 'behavioral'
  | 'portfolio'
  | 'take_home'
  | 'product_critique'
  | 'hiring_manager'
  | 'whiteboard'

export type PrepSection = {
  id: string
  job_id: string
  category: PrepCategory
  answer: string
  sort_order: number
  interview_date: string | null
  freeform_note: string
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
