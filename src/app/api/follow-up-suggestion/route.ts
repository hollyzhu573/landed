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
  const { name, role, company, howWeMet, notes, daysSince } = (await req.json()) as {
    name: string
    role?: string
    company?: string
    howWeMet?: string
    notes: string[]
    daysSince: number | null
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ topic: '', message: '', error: 'No GEMINI_API_KEY set in .env.local' })

  const cleaned = notes.map(stripHtml).filter(Boolean).join('\n\n')

  const contactLine = [
    name,
    role && company ? `${role} at ${company}` : role ?? company ?? null,
    howWeMet ? `met via ${howWeMet}` : null,
  ].filter(Boolean).join(' — ')

  const lastContactContext = daysSince !== null
    ? `They last spoke ${daysSince} day${daysSince === 1 ? '' : 's'} ago.`
    : 'The exact timing of their last conversation is unknown.'

  const prompt = `You are helping a new grad designer write a follow-up message to a networking contact. ${lastContactContext}

Contact: ${contactLine}

Notes from previous conversations:
${cleaned || '(no notes recorded — treat this as a general check-in after some time apart)'}

Your job: suggest a natural, specific follow-up that this new grad designer would actually send.

Return a JSON object with exactly two fields:
- "topic": 1–2 sentences. The specific thing to bring up and why — a question rooted in what was discussed, a callback to advice they gave, or a genuine reason to reconnect. Concrete, not generic. Think about what a new grad designer would actually want to know from this person.
- "message": a short LinkedIn message ready to copy-paste. 2–4 sentences. Should sound like a real person wrote it — warm and specific. Reference something from the notes if available. No signature line needed. No placeholders.

Rules:
- Do NOT open with "Hope you're doing well" or any filler opener — start with something real
- Only reference things the contact said or did — never invent things the user has done, accomplished, or worked on
- If the message would naturally include something from the user's side (e.g. a project, update, or progress), use a mad libs placeholder in brackets instead, like [what you've been working on] or [a recent project you finished]
- Keep the message short and simple — 2–3 sentences max
- Warm and genuine, not stiff or salesy
- If notes are sparse, write a simple check-in that references the connection or something the contact mentioned
- Return only valid JSON, no markdown, no explanation`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[follow-up-suggestion] Gemini error', res.status, errText)
      return NextResponse.json({ topic: '', message: '', error: `Gemini ${res.status}: ${errText}` })
    }

    const data = await res.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!text) {
      return NextResponse.json({ topic: '', message: '', error: `No text in response. Full: ${JSON.stringify(data)}` })
    }

    const start = text.indexOf('{')
    const end   = text.lastIndexOf('}')
    if (start === -1 || end <= start) {
      return NextResponse.json({ topic: '', message: '', error: `Could not find JSON in response: ${text}` })
    }

    const parsed = JSON.parse(text.slice(start, end + 1))
    return NextResponse.json({
      topic:   parsed.topic   ?? '',
      message: parsed.message ?? '',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[follow-up-suggestion] unexpected error', err)
    return NextResponse.json({ topic: '', message: '', error: message })
  }
}
