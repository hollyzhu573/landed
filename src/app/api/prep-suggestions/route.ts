import { NextRequest, NextResponse } from 'next/server'
import type { PrepCategory } from '@/src/lib/types'

const CATEGORY_CONTEXT: Record<PrepCategory, string> = {
  behavioral:      'behavioral / values interview (situational questions, STAR stories, how they handle conflict, ambiguity, cross-functional work)',
  portfolio:       'portfolio review (presenting past work, defending decisions, showing design thinking and impact)',
  take_home:       'take-home design exercise (scoping an open-ended brief, structuring the approach, presenting back)',
  product_critique:'product critique round (evaluating a live product, identifying real problems, proposing prioritized improvements)',
  hiring_manager:  'hiring manager conversation (culture fit, career motivations, growth mindset, questions to ask)',
  whiteboard:      'whiteboard / live design challenge (structuring real-time design thinking, asking the right clarifying questions)',
}

function buildPrompt(company: string, role: string, category: PrepCategory, jobUrl?: string): string {
  const jobContext = jobUrl ? `\nJob posting: ${jobUrl}` : ''
  return `You are helping a new grad designer prepare for a ${CATEGORY_CONTEXT[category]} at ${company} for a ${role} position.${jobContext}

Search for and use real information about ${company}'s design interview process: what they actually ask, what they care about in designers, their known values and product culture, and any patterns from Glassdoor, Blind, or design community reports about interviewing there.

Generate 5 note starters for this interview type at ${company}. Each should be the opening of a sentence the designer writes and then continues — like "My strongest example of this is when I..." or "The thing I want ${company} to take away is...".

Mix two types:
- 2–3 starters specific to ${company}: grounded in their design culture, what they're known to value, or what this role likely demands
- 2–3 starters that are broadly important for designers right now regardless of company — things like how they use AI in their workflow, designing at scale, working with ambiguous briefs, cross-functional influence, or shipping in fast-moving product teams

Rules:
- Each must be an incomplete sentence that invites the designer to keep writing
- Max 10 words per starter
- Do not end with a period

Return only a JSON array of 5 strings — no explanation, no markdown, just the array.`
}

export async function POST(req: NextRequest) {
  const { company, role, category, jobUrl } = (await req.json()) as {
    company: string
    role: string
    category: PrepCategory
    jobUrl?: string
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ suggestions: [] })

  const prompt = buildPrompt(company, role, category, jobUrl)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[prep-suggestions] Gemini error', res.status, errText)
      return NextResponse.json({ suggestions: [] })
    }

    const data = await res.json()
    console.log('[prep-suggestions] raw response:', JSON.stringify(data))
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    console.log('[prep-suggestions] extracted text:', text)

    const startIdx = text.indexOf('[')
    const endIdx = text.lastIndexOf(']')
    if (startIdx === -1 || endIdx <= startIdx) {
      console.error('[prep-suggestions] no JSON array found in text:', text)
      return NextResponse.json({ suggestions: [], debug: `no array found in: ${text.slice(0, 300)}` })
    }

    const suggestions = JSON.parse(text.slice(startIdx, endIdx + 1)) as string[]
    return NextResponse.json({ suggestions: suggestions.slice(0, 5) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[prep-suggestions] unexpected error', msg)
    return NextResponse.json({ suggestions: [], debug: msg })
  }
}
