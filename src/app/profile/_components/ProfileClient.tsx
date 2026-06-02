'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, FileText, RefreshCw, Check, Loader2, MapPin, Mail, Phone, Link2 } from 'lucide-react'
import { saveProfile } from '../actions'
import type { UserProfile, ResumeExperience, ResumeEducation } from '@/src/lib/types'

type ParsedProfile = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>

type Props = {
  initialProfile: UserProfile | null
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'parsing' }
  | { kind: 'preview'; data: ParsedProfile; filename: string }
  | { kind: 'saved' }
  | { kind: 'error'; message: string }

export default function ProfileClient({ initialProfile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>(
    initialProfile ? { kind: 'saved' } : { kind: 'idle' }
  )
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  const [isPending, startTransition] = useTransition()

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setPhase({ kind: 'error', message: 'Only PDF files are supported.' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhase({ kind: 'error', message: 'File too large — max 10 MB.' })
      return
    }

    setPhase({ kind: 'parsing' })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/parse-resume', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok || json.error) {
        setPhase({ kind: 'error', message: json.error ?? 'Parsing failed' })
        return
      }

      setPhase({ kind: 'preview', data: normalizeProfile(json.profile as Partial<ParsedProfile>), filename: file.name })
    } catch (err) {
      setPhase({ kind: 'error', message: err instanceof Error ? err.message : 'Network error' })
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleSave() {
    if (phase.kind !== 'preview') return
    const { data, filename } = phase

    startTransition(async () => {
      const result = await saveProfile({ ...data, resume_filename: filename })
      if (result.error) {
        setPhase({ kind: 'error', message: result.error })
      } else {
        setProfile({ ...data, resume_filename: filename } as UserProfile)
        setPhase({ kind: 'saved' })
      }
    })
  }

  function normalizeProfile(p: Partial<ParsedProfile>): ParsedProfile {
    return {
      name: p.name ?? null,
      email: p.email ?? null,
      phone: p.phone ?? null,
      location: p.location ?? null,
      linkedin_url: p.linkedin_url ?? null,
      portfolio_url: p.portfolio_url ?? null,
      summary: p.summary ?? null,
      skills: p.skills ?? [],
      tools: p.tools ?? [],
      experience: p.experience ?? [],
      education: p.education ?? [],
      resume_filename: p.resume_filename ?? null,
    }
  }

  const displayProfile: ParsedProfile | null =
    phase.kind === 'preview'
      ? normalizeProfile(phase.data)
      : profile
        ? normalizeProfile(profile)
        : null

  return (
    <div className="flex flex-col gap-6">
      {/* Upload card */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Resume</h2>
              {profile?.resume_filename && phase.kind === 'saved' && (
                <p className="mt-0.5 text-xs text-zinc-400 flex items-center gap-1.5">
                  <FileText size={11} />
                  {profile.resume_filename}
                </p>
              )}
            </div>

            {(phase.kind === 'saved' || phase.kind === 'preview') && (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                <RefreshCw size={12} />
                Replace resume
              </button>
            )}
          </div>
        </div>

        {/* Upload zone — shown when idle, parsing, or error */}
        {(phase.kind === 'idle' || phase.kind === 'parsing' || phase.kind === 'error') && (
          <div
            className={`
              mx-6 my-4 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-8 py-12 transition-colors cursor-pointer
              ${phase.kind === 'parsing' ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}
            `}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => phase.kind !== 'parsing' && inputRef.current?.click()}
          >
            {phase.kind === 'parsing' ? (
              <>
                <Loader2 size={24} className="text-zinc-400 animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-700">Parsing resume…</p>
                  <p className="mt-1 text-xs text-zinc-400">Extracting your experience, skills, and background</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                  <Upload size={18} className="text-zinc-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-700">
                    Drop your resume here, or <span className="text-[var(--color-lavender)]">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">PDF only · max 10 MB</p>
                </div>
                {phase.kind === 'error' && (
                  <p className="rounded-lg bg-red-50 px-4 py-2 text-xs text-red-600 font-medium">
                    {phase.message}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Preview banner — shown after parse before save */}
        {phase.kind === 'preview' && (
          <div className="flex items-center gap-3 border-b border-zinc-100 bg-amber-50 px-6 py-3">
            <FileText size={14} className="text-amber-600 shrink-0" />
            <p className="flex-1 text-xs text-amber-800">
              <span className="font-semibold">Parsed:</span> {phase.filename} — review your profile below, then save.
            </p>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Save profile
            </button>
          </div>
        )}

        {/* Saved confirmation */}
        {phase.kind === 'saved' && profile && (
          <div className="flex items-center gap-2 border-b border-zinc-100 bg-[var(--color-sage)]/8 px-6 py-2.5">
            <Check size={13} className="text-[var(--color-sage)]" />
            <p className="text-xs text-zinc-600">
              Profile saved — used as context in interview prep suggestions
            </p>
          </div>
        )}
      </div>

      {/* Profile data — shown after parse or if saved */}
      {displayProfile && (
        <>
          {/* Personal info */}
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Personal info</p>
            </div>
            <div className="px-6 py-5">
              {displayProfile.name && (
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">{displayProfile.name}</h3>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {displayProfile.location && (
                  <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <MapPin size={13} className="text-zinc-400" />
                    {displayProfile.location}
                  </span>
                )}
                {displayProfile.email && (
                  <a href={`mailto:${displayProfile.email}`} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
                    <Mail size={13} className="text-zinc-400" />
                    {displayProfile.email}
                  </a>
                )}
                {displayProfile.phone && (
                  <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <Phone size={13} className="text-zinc-400" />
                    {displayProfile.phone}
                  </span>
                )}
                {displayProfile.linkedin_url && (
                  <a href={displayProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
                    <Link2 size={13} className="text-zinc-400" />
                    LinkedIn
                  </a>
                )}
                {displayProfile.portfolio_url && (
                  <a href={displayProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
                    <Link2 size={13} className="text-zinc-400" />
                    Portfolio
                  </a>
                )}
              </div>
              {displayProfile.summary && (
                <p className="mt-4 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-4">
                  {displayProfile.summary}
                </p>
              )}
            </div>
          </div>

          {/* Skills & Tools */}
          {(displayProfile.skills.length > 0 || displayProfile.tools.length > 0) && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Skills &amp; Tools</p>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                {displayProfile.skills.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-zinc-400">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {displayProfile.skills.map((s) => (
                        <span key={s} className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {displayProfile.tools.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-zinc-400">Tools</p>
                    <div className="flex flex-wrap gap-1.5">
                      {displayProfile.tools.map((t) => (
                        <span key={t} className="rounded-md bg-[var(--color-lavender)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-lavender)]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {displayProfile.experience.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Experience</p>
              </div>
              <div className="divide-y divide-zinc-100">
                {displayProfile.experience.map((exp, i) => (
                  <ExperienceRow key={i} exp={exp} />
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {displayProfile.education.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Education</p>
              </div>
              <div className="divide-y divide-zinc-100">
                {displayProfile.education.map((edu, i) => (
                  <EducationRow key={i} edu={edu} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

function ExperienceRow({ exp }: { exp: ResumeExperience }) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{exp.role}</p>
          <p className="text-sm text-zinc-500">{exp.company}</p>
        </div>
        {(exp.start_date || exp.end_date) && (
          <p className="shrink-0 text-xs text-zinc-400 tabular-nums mt-0.5">
            {exp.start_date ?? ''}{exp.start_date && exp.end_date ? ' – ' : ''}{exp.end_date ?? ''}
          </p>
        )}
      </div>
      {exp.bullets.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-1">
          {exp.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-600">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EducationRow({ edu }: { edu: ResumeEducation }) {
  const degreeLine = [edu.degree, edu.field].filter(Boolean).join(' in ')
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-4">
      <div>
        <p className="text-sm font-semibold text-zinc-900">{edu.school}</p>
        {degreeLine && <p className="text-sm text-zinc-500">{degreeLine}</p>}
      </div>
      {edu.graduation_year && (
        <p className="shrink-0 text-xs text-zinc-400 tabular-nums mt-0.5">{edu.graduation_year}</p>
      )}
    </div>
  )
}
