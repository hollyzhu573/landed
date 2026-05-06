import { NextRequest, NextResponse } from 'next/server'
import type { PrepCategory } from '@/src/lib/types'

const PROMPTS: Record<PrepCategory, string> = {
  behavioral:
    'Generate 5 note starters for a designer prepping behavioral interview answers for a {role} role at {company}. Each should be the opening of a sentence they would write in their notes — something like "My strongest example here is when I..." or "The impact I drove on this was...". They should invite the person to keep writing. Return only a JSON array of strings — no explanation, no markdown, just the array.',
  portfolio:
    'Generate 5 note starters for a designer prepping a portfolio walkthrough for a {role} interview at {company}. Each should be the opening of a sentence they would write — like "I\'m leading with this project because..." or "The decision I\'m most proud of here was...". Return only a JSON array of strings.',
  take_home:
    'Generate 5 note starters for a designer prepping for a take-home exercise for a {role} role at {company}. Each should be the opening of a planning note — like "My approach: I\'ll start by..." or "Before I begin, I need to clarify...". Return only a JSON array of strings.',
  product_critique:
    'Generate 5 note starters for a designer prepping a product critique for a {role} interview at {company}. Each should be the opening of a note — like "What this product does well..." or "The change I\'d prioritize and why...". Return only a JSON array of strings.',
  hiring_manager:
    'Generate 5 note starters for a designer prepping for a hiring manager interview for a {role} role at {company}. Each should be the opening of a planning note — like "I want to ask them about..." or "What I want them to know about me...". Return only a JSON array of strings.',
  whiteboard:
    'Generate 5 note starters for a designer prepping for a whiteboard interview for a {role} role at {company}. Each should be the opening of a planning note — like "I\'ll kick off by asking about..." or "The framework I\'m planning to use...". Return only a JSON array of strings.',
}

export async function POST(req: NextRequest) {
  const { company, role, category } = (await req.json()) as {
    company: string
    role: string
    category: PrepCategory
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ suggestions: [] })

  const prompt = (PROMPTS[category] ?? PROMPTS.behavioral)
    .replace('{company}', company)
    .replace('{role}', role)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[prep-suggestions] Gemini error', res.status, errText)
      return NextResponse.json({ suggestions: [] })
    }

    const data = await res.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Use indexOf/lastIndexOf to correctly capture arrays whose items contain brackets
    const startIdx = text.indexOf('[')
    const endIdx = text.lastIndexOf(']')
    if (startIdx === -1 || endIdx <= startIdx) return NextResponse.json({ suggestions: [] })

    const suggestions = JSON.parse(text.slice(startIdx, endIdx + 1)) as string[]
    return NextResponse.json({ suggestions: suggestions.slice(0, 5) })
  } catch (err) {
    console.error('[prep-suggestions] unexpected error', err)
    return NextResponse.json({ suggestions: [] })
  }
}
