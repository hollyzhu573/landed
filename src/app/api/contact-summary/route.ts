import { NextRequest, NextResponse } from 'next/server'

function stripHtml(html: string): string {
  return html
    .replace(/<\/?(p|div|br|li)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  const { name, notes } = (await req.json()) as { name: string; notes: string[] }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ remember: [], actions: [], error: 'No GEMINI_API_KEY set in .env.local' })

  const cleaned = notes.map(stripHtml).filter(Boolean).join('\n\n')
  if (!cleaned) return NextResponse.json({ remember: [], actions: [] })

  const prompt = `You are reading raw notes a job seeker took about their networking contact ${name}. Extract the most useful things to surface back to them.

Notes:
${cleaned}

Return a JSON object with exactly two fields:
- "remember": array of 2–3 short strings — key things worth remembering about this person or their situation
- "actions": array of 1–3 short strings — concrete follow-up actions mentioned or implied, or empty array if none

Rules:
- Each string should be one short sentence, max ~10 words
- Only include things actually present in the notes, do not invent
- If nothing actionable was mentioned, return actions as []
- Return only valid JSON, no markdown, no explanation`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[contact-summary] Gemini error', res.status, errText)
      return NextResponse.json({ remember: [], actions: [], error: `Gemini ${res.status}: ${errText}` })
    }

    const data = await res.json()
    console.log('[contact-summary] raw Gemini response:', JSON.stringify(data))
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!text) {
      return NextResponse.json({ remember: [], actions: [], error: `No text in response. Full response: ${JSON.stringify(data)}` })
    }

    const start = text.indexOf('{')
    const end   = text.lastIndexOf('}')
    if (start === -1 || end <= start) {
      return NextResponse.json({ remember: [], actions: [], error: `Could not find JSON in response: ${text}` })
    }

    const parsed = JSON.parse(text.slice(start, end + 1))
    return NextResponse.json({
      remember: (parsed.remember ?? []).slice(0, 3),
      actions:  (parsed.actions  ?? []).slice(0, 3),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[contact-summary] unexpected error', err)
    return NextResponse.json({ remember: [], actions: [], error: message })
  }
}
