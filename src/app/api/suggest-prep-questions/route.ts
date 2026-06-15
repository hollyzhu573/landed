import { NextRequest, NextResponse } from 'next/server'

type JobAnalysis = {
  lookingFor: string[]
  skills: string[]
  prepTips: string[]
}

type BankQuestion = {
  question: string
  category: string | null
}

type RequestBody = {
  company: string
  role: string
  notes?: string
  jobAnalysis?: JobAnalysis
  interviewType?: string
  instructions?: string
  bankQuestions: BankQuestion[]
  existingQuestions: string[]
}

type Suggestion = {
  question: string
  category: string
  rationale: string
  fromBank: boolean
}

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  behavioral: 'Behavioral',
  portfolio:  'Portfolio review',
  case_study: 'Case study',
  technical:  'Technical / design challenge',
  other:      'General',
}

function formatBankQuestions(questions: BankQuestion[]): string {
  if (questions.length === 0) return '(empty — generate new questions)'

  const grouped: Record<string, string[]> = {}
  for (const q of questions) {
    const key = q.category ?? 'not categorized'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(q.question)
  }

  return Object.entries(grouped)
    .map(([cat, qs]) => `${cat.toUpperCase()} (${qs.length}):\n${qs.map(q => `  - ${q}`).join('\n')}`)
    .join('\n\n')
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody
  const { company, role, notes, jobAnalysis, interviewType, instructions, bankQuestions, existingQuestions } = body

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No GEMINI_API_KEY set in .env.local' })

  const interviewLabel = interviewType ? (INTERVIEW_TYPE_LABELS[interviewType] ?? interviewType) : 'General'

  const contextLines: string[] = []
  if (notes) contextLines.push(`Job notes: ${notes}`)
  if (jobAnalysis) {
    if (jobAnalysis.lookingFor.length > 0)
      contextLines.push(`What they're looking for: ${jobAnalysis.lookingFor.join(', ')}`)
    if (jobAnalysis.skills.length > 0)
      contextLines.push(`Key skills: ${jobAnalysis.skills.join(', ')}`)
    if (jobAnalysis.prepTips.length > 0)
      contextLines.push(`Prep focus: ${jobAnalysis.prepTips.join(', ')}`)
  }

  const existingBlock = existingQuestions.length > 0
    ? `Already added to prep (skip these):\n${existingQuestions.map(q => `- ${q}`).join('\n')}`
    : 'Already added to prep: (none yet)'

  const prompt = `You are helping a new grad designer prepare for a specific job interview.

Role: ${role} at ${company}
Interview type: ${interviewLabel}
${instructions ? `\nCompany's interview instructions:\n${instructions}\n` : ''}${contextLines.length > 0 ? '\n' + contextLines.join('\n') : ''}

Question bank (the candidate's existing questions to draw from):
${formatBankQuestions(bankQuestions)}

${existingBlock}

Your job: suggest 10 questions to prepare for this ${interviewLabel} interview.

Priority rules:
1. Pull relevant questions directly from the question bank — prefer surfacing existing questions over inventing new ones
2. For a "${interviewLabel}" interview, prioritize ${interviewType ?? 'relevant'} questions from the bank
3. Include questions from other categories only if they're genuinely applicable to this interview type (e.g. a portfolio review often involves behavioral follow-ups)
4. Only generate new questions (not in the bank) if the bank is sparse or missing important areas
5. For bank questions, use the EXACT wording from the bank
6. Do not include any questions from "Already added to prep"

Return a JSON array:
[
  {
    "question": "exact question text",
    "category": "behavioral" | "portfolio" | "case_study" | "technical" | "other",
    "rationale": "1 short sentence on why this is relevant for this specific interview",
    "fromBank": true
  }
]

Set "fromBank": true if the question was taken from the bank, false if newly generated.
Return only valid JSON, no markdown, no explanation.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(25_000),
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[suggest-prep-questions] Gemini error', res.status, errText)
      return NextResponse.json({ error: `Gemini ${res.status}: ${errText}` })
    }

    const data = await res.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!text) {
      return NextResponse.json({ error: `No text in Gemini response. Full: ${JSON.stringify(data)}` })
    }

    const start = text.indexOf('[')
    const end   = text.lastIndexOf(']')
    if (start === -1 || end <= start) {
      return NextResponse.json({ error: `Could not parse suggestions: ${text}` })
    }

    const suggestions: Suggestion[] = JSON.parse(text.slice(start, end + 1))
    return NextResponse.json({ suggestions: suggestions.slice(0, 12) })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isTimeout = message.includes('aborted') || message.includes('timeout')
    console.error('[suggest-prep-questions] unexpected error', err)
    return NextResponse.json({
      error: isTimeout ? 'Timed out — try again' : message,
    })
  }
}
