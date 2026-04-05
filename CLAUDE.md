# Landed — Claude Code Context

## What is Landed?
Landed is a personal recruiting tracker built for new grad designers. It helps track job applications, manage networking contacts, and organize interview prep — all in one clean, minimal interface.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (Postgres)
- **Hosting**: Vercel

## Core Modules

### 1. Job Tracker
Track every job application through its lifecycle.

**Fields:**
- `id` (uuid)
- `company` (string)
- `role` (string)
- `status` (enum: `bookmarked` | `applied` | `phone_screen` | `interview` | `offer` | `rejected` | `withdrawn`)
- `date_applied` (date)
- `job_url` (string)
- `portfolio_link` (string) — which version of portfolio was submitted
- `salary_min` / `salary_max` (integer, optional)
- `notes` (text)
- `created_at` / `updated_at` (timestamp)

### 2. Networking Tracker
Track LinkedIn outreach and follow-ups with contacts.

**Fields:**
- `id` (uuid)
- `name` (string)
- `company` (string)
- `role` (string)
- `linkedin_url` (string)
- `how_we_met` (string)
- `last_contact_date` (date)
- `follow_up_days` (integer) — how many days until follow-up reminder
- `follow_up_due` (computed: last_contact_date + follow_up_days)
- `status` (enum: `to_reach_out` | `waiting` | `active` | `archived`)
- `notes` (text)
- `job_id` (uuid, optional foreign key → jobs)
- `created_at` / `updated_at` (timestamp)

### 3. Interview Prep
Attach prep notes to a specific job application.

**Fields:**
- `id` (uuid)
- `job_id` (uuid, foreign key → jobs)
- `question` (string)
- `answer` (text)
- `category` (enum: `behavioral` | `portfolio` | `case_study` | `technical` | `other`)
- `created_at` / `updated_at` (timestamp)

## Design Philosophy
- **Clean and minimal** — generous whitespace, restrained color palette, no clutter
- Prioritize clarity and scannability over decoration
- Tailwind utility classes only, no custom CSS unless absolutely necessary
- Mobile-aware but desktop-first (this is a productivity tool)

## Code Conventions
- Use the **App Router** (not Pages Router)
- Prefer **server components** by default; use `"use client"` only when needed
- Use **Supabase client** via `@supabase/ssr` for server/client split
- Keep components small and composable
- Co-locate types with their relevant modules
- Use **TypeScript strictly** — no `any`

## Project Structure
```
src/
  app/
    layout.tsx
    page.tsx
    jobs/
    network/
    prep/
    api/
  components/
    ui/         # Reusable primitives (buttons, inputs, badges)
    jobs/       # Job-specific components
    network/    # Networking-specific components
    prep/       # Interview prep components
  lib/
    supabase/   # Supabase client setup
    types.ts    # Shared TypeScript types
    utils.ts    # Helper functions
```

## Key Behaviors
- The networking tracker should surface contacts with a follow-up due today or overdue, shown prominently at the top
- Job status should be updatable inline (e.g. drag or quick-select, not a full page reload)
- Interview prep notes are scoped to a specific job — always accessible from the job detail view
- No auth needed for now — this is a single-user personal tool
